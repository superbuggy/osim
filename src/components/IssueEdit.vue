<script setup lang="ts">
// import type {Flaw} from '@/generated-client';
import { DateTime } from 'luxon';
import {computed, reactive, ref} from 'vue';
import EditableText from '../components/widgets/EditableText.vue';
import LabelEditable from '@/components/widgets/LabelEditable.vue';
import * as zf from '../types/zodFlaw';
import LabelSelect from '@/components/widgets/LabelSelect.vue';
import {ZodFlawSchema} from '../types/zodFlaw';
import LabelTextarea from '@/components/widgets/LabelTextarea.vue';
import {getFlawBugzillaLink, getFlawOsimLink, postFlawPublicComment, putFlaw} from '@/services/FlawService';
import type {ZodFlawType} from '../types/zodFlaw';
import {useField, useForm} from 'vee-validate';
import {toTypedSchema} from '@vee-validate/zod';
import {z} from 'zod';
const router = useRouter();
import LabelInput from '@/components/widgets/LabelInput.vue';
import {useRouter} from 'vue-router';
import {useToastStore} from '@/stores/ToastStore';
import CveRequestForm from '@/components/CveRequestForm.vue';
import {getDisplayedOsidbError} from '@/services/OsidbAuthService';
import PillList from '@/components/widgets/PillList.vue';
import LabelCheckbox from '@/components/widgets/LabelCheckbox.vue';
import AffectedOfferingForm from '@/components/AffectedOfferingForm.vue';
import {postAffect, putAffect} from '@/services/AffectService';
import {notifyApiKeyUnset} from '@/services/ApiKeyService';

const {addToast} = useToastStore();

const props = defineProps<{
  // flaw: Flaw,
  flaw: any,
}>();

const emit = defineEmits<{
  'refresh:flaw': [],
}>();

notifyApiKeyUnset();

// const flawTypes = Object.values(ZodFlawSchema.shape.type.unwrap().enum) as string[];
const flawTypes = Object.values(ZodFlawSchema.shape.type.unwrap().unwrap().enum) as string[];
// const flawSources = Object.values(ZodFlawSchema.shape.source.unwrap().enum) as string[];
// const flawImpacts = Object.values(ZodFlawSchema.shape.impact.unwrap().enum) as string[];
const flawSources = Object.values(ZodFlawSchema.shape.source.unwrap().unwrap().enum) as string[];
const flawImpacts = Object.values(ZodFlawSchema.shape.impact.unwrap().unwrap().enum) as string[];
const incidentStates = Object.values(ZodFlawSchema.shape.major_incident_state.unwrap().unwrap().enum) as string[];


console.log(flawTypes);
console.log(flawSources);
console.log(flawImpacts);

const validationSchema = toTypedSchema(ZodFlawSchema);

const {handleSubmit, errors, setValues, values} = useForm({
  validationSchema,
  // initialValues: {
  //
  // },
});

const cveIds = ref<string[]>([]);
const theAffects = ref<any[]>(props.flaw.affects);

const {value: flawType} = useField<string>('type');
const {value: flawCve_id} = useField<string>('cve_id');
const {value: flawImpact} = useField<string>('impact');
const {value: flawComponent} = useField<string>('component');
const {value: flawTitle} = useField<string>('title');
const {value: flawDescription} = useField<string>('description');
const {value: flawSummary} = useField<string>('summary');
const {value: flawRequires_summary} = useField<string>('requires_summary');
const {value: flawStatement} = useField<string>('statement');
const {value: flawCwe_id} = useField<string>('cwe_id');
const {value: flawUnembargo_dt} = useField<string>('unembargo_dt');
const {value: flawSource} = useField<string>('source');
const {value: flawReported_dt} = useField<string>('reported_dt');
const {value: flawMitigation} = useField<string>('mitigation');
const {value: flawCvss2} = useField<string>('cvss2');
const {value: flawCvss2_score} = useField<number>('cvss2_score');
const {value: flawNvd_cvss2} = useField<string>('nvd_cvss2');
const {value: flawCvss3} = useField<string>('cvss3');
const {value: flawCvss3_score} = useField<number>('cvss3_score');
const {value: flawNvd_cvss3} = useField<string>('nvd_cvss3');
const {value: flawMajor_incident_state} = useField<string>('major_incident_state');
const {value: flawNist_cvss_validation} = useField<string>('nist_cvss_validation');
const {value: flawEmbargoed} = useField<boolean>('embargoed');
const {value: flawUpdated_dt} = useField<string>('updated_dt');

let committedFlaw: ZodFlawType = reactive(props.flaw);
let stagedFlaw: ZodFlawType = committedFlaw;
setValues(committedFlaw);

const onSubmitAffect = async () => {
  for (let affect of theAffects.value) {
    let go = true;
    console.log('saving the affect', affect);
    console.log(affect.uuid);
    const newAffect = {
      flaw: props.flaw.uuid,
      type: affect.type,
      affectedness: affect.affectedness,
      resolution: affect.resolution,
      ps_module: affect.ps_module,
      ps_component: affect.ps_component,
      impact: affect.impact,
      embargoed: affect.embargoed || false,
      updated_dt: affect.updated_dt,
    }
    if (!go) {
      continue;
    }
    if (affect.uuid != null) {
      await putAffect(affect.uuid, newAffect)
          .then(() => {
            console.log('saved newAffect', newAffect);
            addToast({
              title: 'Info',
              body: `Affect Saved: ${newAffect.ps_component}`,
            });
          })
          .catch(error => {
            const displayedError = getDisplayedOsidbError(error);
            addToast({
              title: 'Error saving Affect',
              body: displayedError,
            });
            console.log(error);
          })
    } else {
      await postAffect(newAffect)
          .then(() => {
            console.log('saved newAffect', newAffect);
            addToast({
              title: 'Info',
              body: `Affect Saved: ${newAffect.ps_component}`,
            });
          })
          .catch(error => {
            const displayedError = getDisplayedOsidbError(error);
            addToast({
              title: 'Error saving Affect',
              body: displayedError,
            });
            console.log(error);
          })
    }
  }
  emit('refresh:flaw');
}

const onSubmit = handleSubmit((flaw: ZodFlawType) => {
  let flawSaved = false;
  // Save Flaw, then safe Affects, then refresh
  putFlaw(props.flaw.uuid, flaw)
      .then(() => {
        flawSaved = true;
        console.log('saved flaw', flaw);
      })
      // .then(saveAffects)
      .then(() => {
        if (flawSaved) {
          addToast({
            title: 'Info',
            body: 'Flaw Saved',
          });
          emit('refresh:flaw');
        }
      })
      .catch(error => {
        const displayedError = getDisplayedOsidbError(error);
        addToast({
          title: 'Error saving Flaw',
          body: displayedError,
        });
        console.log(error);
      })
  for (let affect of theAffects.value) {
    console.log('saving the affect', affect);
  }

  // Promise.reject('success')
  //     .then(() => {
  //       console.log('saved flaw', flaw);
  //       committedFlaw = flaw;
  //       // router.go(0); // refresh the current route, refreshing the loaded flaw
  //       addToast({title: 'Info', body: 'Flaw Saved'});
  //     })
});

const onReset = (payload: MouseEvent) => {
  console.log('onReset');
  setValues(committedFlaw);
}

// const errors = {
//   type: '',
//   source: '',
//   cve_id: '',
//   impact: '',
//   cwe_id: '',
//   cvss3: '',
//   cvss3_score: '',
//   nvd_cvss3: '',
//   reported_dt: '',
//   unembargo_dt: '',
// };

props.flaw.reported_dt = DateTime.fromISO(props.flaw.reported_dt, { zone: 'utc' }).toJSDate();
props.flaw.unembargo_dt = DateTime.fromISO(props.flaw.unembargo_dt, { zone: 'utc' }).toJSDate();

console.log('flaw reported_dt', props.flaw.reported_dt);

const addComment = ref(false);
const newPublicComment = ref('');

const trackerUuids = computed(() => {
  return (props.flaw.affects ?? [])
      .flatMap((affect: any) => {
        return affect.trackers ?? []
      })
      .flatMap((tracker: any) => {
        return {
          uuid: tracker.uuid,
          display: tracker.type + ' ' + tracker.external_system_id,
        };
      })
});


// function onsubmit() {
//
//   const theFlaw: ZodFlawType = {
//     type: props.flaw.type,
//     cve_id: props.flaw.cve_id                               ,
//     impact: props.flaw.impact                               ,
//     component: props.flaw.component                         ,
//     title: props.flaw.title                                 ,
//     description: props.flaw.description                     ,
//     summary: props.flaw.summary                             ,
//     requires_summary: props.flaw.requires_summary           ,
//     statement: props.flaw.statement                         ,
//     cwe_id: props.flaw.cwe_id                               ,
//     unembargo_dt: props.flaw.unembargo_dt                   ,
//     source: props.flaw.source                               ,
//     reported_dt: props.flaw.reported_dt                     ,
//     mitigation: props.flaw.mitigation                       ,
//     cvss2: props.flaw.cvss2                                 ,
//     cvss2_score: props.flaw.cvss2_score                     ,
//     nvd_cvss2: props.flaw.nvd_cvss2                         ,
//     cvss3: props.flaw.cvss3                                 ,
//     cvss3_score: props.flaw.cvss3_score                     ,
//     nvd_cvss3: props.flaw.nvd_cvss3                         ,
//     major_incident_state: props.flaw.major_incident_state   ,
//     nist_cvss_validation: props.flaw.nist_cvss_validation   ,
//     embargoed: props.flaw.embargoed                         ,
//     // updated_dt: props.flaw.updated_dt                       ,
//     updated_dt: moment.utc().toISOString()                  ,
//   }
//
//   putFlaw(props.flaw.uuid, theFlaw)
//       .then(() => {
//         location.reload(); // TODO extremely ugly hack
//       })
// }

function onreset() {
  // TODO FIX
}

function addPublicComment() {
  postFlawPublicComment(props.flaw.uuid, newPublicComment.value)
      .then(() => {
        addToast({
          title: 'Comment saved',
          body: 'Comment saved',
        });
        newPublicComment.value = '';
        addComment.value = false;
        emit('refresh:flaw');
      })
      .catch(e => {
        addToast({
          title: 'Error saving comment',
          body: getDisplayedOsidbError(e),
        });
      })
}

function addBlankAffect() {
  // props.flaw.affects = props.flaw.affects || [];
  theAffects.value.push({});
}
function removeAffect(affectIdx: number) {
  theAffects.value.splice(affectIdx, 1);
}

</script>

<template>
  <form
      class="osim-content container"
      @submit="onSubmit"
  >
    <!--<div class="row">-->
    <!--  <ul class="nav nav-tabs">-->
    <!--    <li class="nav-item"><a href="#" class="nav-link active" aria-current="page">Issue Details</a></li>-->
    <!--    <li class="nav-item"><a href="#" class="nav-link">Raw View</a></li>-->
    <!--  </ul>-->
    <!--</div>-->

    <div class="row mt-3 mb-5">
      <LabelEditable v-model="flawTitle"  label="Title" type="text"/>

      <div class="col">
        <div class="row">
          <div class="col-6">
            <!--<div>UUID: {{ flaw.uuid }}</div>-->
            <LabelEditable label="Component" type="text" v-model="flawComponent" :error="errors.component"/>
            <!--<div>Type: {{ flaw.type }}</div>-->
<!--            <label>Type <EditableText v-model="flawType"/></label>-->
            <LabelSelect label="Type" :options="flawTypes" v-model="flawType" :error="errors.type"/>
            <!--<div>CVE ID: {{ flaw.cve_id }}</div>-->
            <div class="">
              <div class="row">
                <div class="col">
                  <label class="osim-input has-validation mb-3 border-start ps-3">
                    <span class="form-label">
                      CVE IDs
                    </span>
                    <PillList v-model="cveIds"/>
                  </label>
                  <LabelEditable
                      label="CVE ID" type="text" v-model="flawCve_id" :error="errors.cve_id"/>
                </div>
                <div v-if="!(flawCve_id || '').includes('CVE')" class="col-auto align-self-end mb-3">
                  <CveRequestForm
                      :bugzilla-link="getFlawBugzillaLink(flaw)"
                      :osim-link="getFlawOsimLink(flaw.uuid)"
                      :subject="flawTitle"
                      :description="flawDescription"
                  />
                </div>
              </div>
            </div>
            <LabelSelect label="Impact" :options="flawImpacts" v-model="flawImpact" :error="errors.impact"/>
            <LabelEditable label="CVSS3" type="text" v-model="flawCvss3" :error="errors.cvss3"/>
            <LabelInput label="CVSS3 Score" type="text" v-model="flawCvss3_score" :error="errors.cvss3_score"/>
            <LabelEditable label="NVD CVSS3" type="text" v-model="flawNvd_cvss3" :error="errors.nvd_cvss3"/>
            <LabelEditable label="CWE ID" type="text" v-model="flawCwe_id" :error="errors.cwe_id"/>
            <LabelSelect label="Source" :options="flawSources" v-model="flawSource" :error="errors.source"/>
          </div>
          <div class="col-6">
            <LabelSelect label="Incident State" :options="incidentStates" v-model="flawMajor_incident_state" :error="errors.major_incident_state"/>

            <LabelEditable label="Reported Date" type="date" v-model="flawReported_dt" :error="errors.reported_dt"/>
            <LabelEditable
                :label="'Public Date' + (DateTime.fromJSDate(flaw.unembargo_dt).diffNow().milliseconds > 0 ? ' [FUTURE]' : '')"
                type="date"
                v-model="flawUnembargo_dt"
                :error="errors.unembargo_dt"/>
            <div>
              <div v-if="flaw.trackers && flaw.trackers.length > 0">Trackers:</div>
              <!--<div v-for="tracker in flaw.trackers">{{ tracker }}</div>-->
              <div v-for="tracker in trackerUuids">
                <RouterLink :to="{name: 'tracker-details', params: {id: tracker.uuid}}">
                  {{ tracker.display }}
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
        <div class="row osim-affects mb-3">
          <div class="h5">Affected Offerings</div>
          <div
              v-if="theAffects"
              v-for="(affect, affectIdx) in theAffects"
              class="container-fluid row affected-offering">
            <AffectedOfferingForm
                class=""
                v-model="theAffects[affectIdx]"
                @remove="removeAffect(affectIdx)"
            />
          </div>

          <div>
            <div class="h6">Add New Affect</div>
            <button
                type="button"
                class="btn btn-secondary"
                @click.prevent="addBlankAffect()"
            >Add New Affect</button>
          </div>
        </div>

        <div class="row">
          <LabelTextarea label="Summary" v-model="flawSummary"/>
          <LabelTextarea label="Description" v-model="flawDescription"/>
          <LabelTextarea label="Statement" v-model="flawStatement"/>
          <LabelTextarea label="Mitigation" v-model="flawMitigation"/>
        </div>
      </div>

      <h3 class="mt-3 mb-2">Comments</h3>
      <div class="row">
        <ul>
          <li class="p-3" v-for="comment in flaw.comments">
            <p class="border-top pt-2">{{comment.meta_attr.creator}} / <a :href="'#' + comment.type + '/' + comment.external_system_id">{{comment.meta_attr.time}}</a> <span v-if="comment.meta_attr.is_private.toLowerCase() === 'true'">(internal)</span></p>
            <p>{{comment.meta_attr.text}}</p>
          </li>
        </ul>
        <div v-if="!addComment">
          <button
              type="button"
              @click="addComment = true"
              class="btn btn-secondary col"
          >Add Public Comment</button>
        </div>
        <div v-if="addComment">
        <LabelTextarea label="New Public Comment" v-model="newPublicComment"/>
          <button
              type="button"
              @click="addPublicComment"
              class="btn btn-primary col"
          >Add Public Comment</button>
          <!--          <button type="button" class="btn btn-primary col">Add Private Comment</button>-->
        </div>

      </div>

<!--      <div class="row">-->
<!--<pre>-->
<!--Staged local values:-->
<!--{{ JSON.stringify(values, null, 2) }}-->
<!--</pre>-->
<!--<pre>-->
<!--Committed values on server:-->
<!--{{ JSON.stringify(committedFlaw, null, 2) }}-->
<!--</pre>-->
<!--      </div>-->

<!--      <hr class="mt-5">-->
    </div>
<!--    <div class="row row-cols-5 osim-action-buttons g-3 pb-5 sticky-bottom align-content-end d-flex ">-->
    <div class="osim-action-buttons sticky-bottom d-grid gap-2 d-flex justify-content-end">
      <!--        <button type="button" class="btn btn-primary col">Customer Pending</button>-->
      <!--        <button type="button" class="btn btn-primary col">Close this issue without actions</button>-->
      <!--        <button type="button" class="btn btn-primary col">Move this issue to another source queue</button>-->
      <!--        <button type="button" class="btn btn-primary col">Create a flaw</button>-->
      <!--        <button type="button" class="btn btn-primary col">Create hardening bug/weakness</button>-->
      <button
          type="button"
          class="btn btn-secondary"
          @click="onReset"
      >Reset Changes</button>
      <button
          type="submit"
          class="btn btn-primary"
          @click="onSubmitAffect"
      >Save Changes</button>
    </div>
  </form>
</template>

<style scoped>
.span-editable-text {
  cursor: text;
}

* {
  line-height: 1.5;
}

.affected-offering {
  border: 1px solid #ddd;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}

.action-buttons > button {
  margin: 0.2rem;
}

.affected-module-component {
  font-weight: bold;
}
.affect-trackers-heading {
  font-size: 100%;
  font-weight: bold;
}


.osim-content.container label {
  display: block;
}

.osim-action-buttons {
  background: white;
  border-top: 1px solid #ddd;
  margin-left: -20px;
  margin-right: -20px;
  padding-right: 20px;
  padding-bottom: 2rem;
  padding-top: 0.5rem;
}

.osim-affects {
  outline: 1px solid #ddd;
  padding: 1.5em;
}

</style>
