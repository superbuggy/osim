<script setup lang="ts">
import {computed, onMounted, reactive, ref} from 'vue'; //AutoScroll option requires onUnmounted
import {getFlaws} from '@/services/FlawService'
import IssueQueueItem from '@/components/IssueQueueItem.vue';
import IssueSearch from './IssueSearch.vue';

type FilteredIssue = {
  issue: any;
  selected: boolean;
};

const issues = ref<any[]>([]);

let issueFilter = ref('');

let filteredIssues = computed<FilteredIssue[]>(() => {
  if (issueFilter.value.length === 0) {
    return issues.value.map(issue => reactive({issue: issue, selected: false}));
  }
  const filterCaseInsensitive = issueFilter.value.toLowerCase();
  return issues.value
      .filter((issue: any) => {
        // return [issue.title, issue.cve_id, issue.state, issue.source].join(' ').toLowerCase().includes(issueFilter.value.toLowerCase());
        return [issue.title, issue.cve_id, issue.state, issue.source].some(text => text && text.toLowerCase().includes(filterCaseInsensitive));
      })
      .map(issue => reactive({issue: issue, selected: false}));
});

function updateSelectAll(selectedAll: boolean) {
  for (let filteredIssue of filteredIssues.value) {
    filteredIssue.selected = selectedAll;
  }
}

let isSelectAllIndeterminate = computed(() => {
  if (filteredIssues.value.length === 0) {
    return false;
  }
  return filteredIssues.value.some((it) => it.selected !== filteredIssues.value[0].selected)
})

let isSelectAllChecked = computed(() => {
  return filteredIssues.value.every(it => it.selected);
})

let offset = ref(0); // Added offset state variable
let pagesize = 20;

onMounted(() => {
  //window.addEventListener('scroll', handleScroll); AutoScroll Option
  getFlaws(offset.value)
      .then(response => {
        console.log('meta.env.DEV', import.meta.env.DEV);
        console.log('IssueQueue: got flaws: ', response.data);
        issues.value = response.data.results;
        offset.value += pagesize; // Increase the offset for next fetch
      })
      .catch(err => {
        console.error('IssueQueue: getFlaws error: ', err);
      })

})

const isFinalPageFetched = ref(false);
const isLoading = ref(false);

const loadMoreFlaws = () => {
  if (isLoading.value || isFinalPageFetched.value) {
    return; // Early exit if already loading
  }
  isLoading.value = true;
  offset.value += pagesize;

  getFlaws(offset.value, pagesize)
    .then(response => {
      if (response.data.results.length < pagesize) {
        isFinalPageFetched.value = true;
        return;
      }
      issues.value = [...issues.value, ...response.data.results];
      offset.value += pagesize;
    })
    .catch(err => {
      console.error('Error fetching more flaws: ', err);
    })
    .finally(() => {
      isLoading.value = false;
    });
};

/*
AutoScroll Method. Maybe have this as a user configurable option in the future?
const handleScroll = () => {
  if (isLoading.value) return; // Do not load more if already loading
  
  const totalHeight = document.documentElement.scrollHeight;
  const scrollPosition = window.scrollY + window.innerHeight;

  if (scrollPosition >= totalHeight) {
    loadMoreFlaws();
  }
};

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
*/

</script>

<template>
  <div class="osim-content container">
    <div class="osim-incident-filter">
      <label>
        <!--Filter By-->
        <!--<select>-->
        <!--  <option value="Issues assigned to Me">Issues assigned to Me</option>-->
        <!--  <option value="Issues assigned to team but unowned">Issues assigned to team but unowned</option>-->
        <!--  <option value="Oldest">Oldest</option>-->
        <!--  <option value="Newest">Newest</option>-->
        <!--</select>-->

        <input type="text" v-model="issueFilter" class="form-text form-control" placeholder="Filter Issues/Flaws"/>
      </label>
    </div>
    <div class="osim-incident-list">
      <table class="table">
        <thead>
        <tr>
          <th><input type="checkbox"
                     :indeterminate="isSelectAllIndeterminate"
                     :checked="isSelectAllChecked"
                     @change="updateSelectAll(($event.target as HTMLInputElement).checked)"
                     aria-label="Select All Issues in Table">
          </th>
          <th>ID</th>
          <th>Impact</th>
          <th>Source</th>
          <th>created_dt</th>
          <th>Title</th>
          <th>State</th>
          <!--<th>Assigned</th>-->
        </tr>
        </thead>
        <tbody class="table-group-divider">
        <template v-for="filteredIssue of filteredIssues">
          <IssueQueueItem :issue="filteredIssue.issue" v-model:selected="filteredIssue.selected" />
        </template>
        </tbody>
      </table>
      
      <span v-if="isFinalPageFetched" role="status">No more pages</span>
      <button
            v-if="!isFinalPageFetched"
            @click="loadMoreFlaws"
            class="btn btn-primary align-self-end"
            type="button"
            :disabled="isLoading"
        >
          <span class="spinner-border spinner-border-sm d-inline-block" role="status" v-if="isLoading">
            <span class="visually-hidden">Loading...</span>
          </span>
          Load More Flaws
        </button>
    </div>
  </div>
</template>
