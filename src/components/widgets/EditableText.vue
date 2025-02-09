<script setup lang="ts">
// EditableText
// Hovering over the text shows an edit button
// Clicking the edit button makes an input field
// Blurring focus or clicking the save button commits the change
// Pressing escape or clicking the abort button aborts the change

import {computed, nextTick, ref, unref} from 'vue';

const props = defineProps<{
  modelValue: string | null,
  readOnly?: boolean,
  editing?: boolean,
  placeholder?: string,
  error?: string,
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | null],
  'update:editing': [value: string],
}>();

const elInput = ref<HTMLInputElement>();
const elDiv = ref<HTMLDivElement>();
const editing = ref<boolean>(props.editing ?? false);
const saveFlashMs = 100;

const editedModelValue = ref<string | null>(unref(props.modelValue));

function beginEdit() {
  editing.value = true;
  nextTick(() => {
    elInput.value?.focus();
  });

}
function commit() {
  editing.value = false;
  emit('update:modelValue', editedModelValue.value);
  console.log('commit');
}
function abort() {
  editing.value = false;
  editedModelValue.value = props.modelValue;
  console.log('abort');
}
function blur(e: FocusEvent | null) {
  if (e == null || e.currentTarget == null) {
    commit();
    return;
  }
  // if (e.currentTarget.contains(e.relatedTarget)) {
  // || elDiv.value?.contains(e.currentTarget)

  if (e.relatedTarget == null) {
    commit();
    return;
  }

  if (e.relatedTarget instanceof Node) {
    if (elDiv.value?.contains(e.relatedTarget)) {
      // abort();
      // Do not commit or abort while navigating within this component (e.g. with tab or clicking)
      return;
    } else {
      // Commit when focus transfers out of this component
      commit();
      return;
    }
  }

  // if (e.currentTarget instanceof Node) {
  //   if (elDiv.value?.contains(e.currentTarget)) {
  //     abort();
  //     return;
  //   }
  // }
}

</script>

<template>
  <div class="position-relative"> <!-- for invalid-tooltip positioning -->
    <!--<Transition name="flash-bg" :duration="2000">-->
  <Transition name="flash-bg">
    <div class="osim-editable-text" v-show="!editing" :tabindex="readOnly ? -1 : 0"
      @focus="beginEdit"
    >
      <span
          class="osim-editable-text-value form-control"
          :class="{'form-control': !readOnly}"
      >{{modelValue === '' ? placeholder : modelValue}}</span>
      <!--if a button is inside a label, clicking the label clicks the button?-->
      <button
          type="button"
          class="osim-editable-text-pen input-group-text"
          v-if="!readOnly"
          tabindex="-1"
          @click="beginEdit"
      ><i class="bi bi-pencil"></i></button>
    </div>
  </Transition>
  <div class="input-group has-validation"
       v-show="editing"
       @blur="blur($event)"
       ref="elDiv"
  >
    <input class="form-control"
           v-model="editedModelValue"
           type="text"
           ref="elInput"
           :placeholder="placeholder"
           @blur="blur($event)"
           @keyup.esc="abort"
    />
    <button
        type="button"
        class="input-group-text"
        @click="commit"
        @blur="blur($event)"
        tabindex="-1"
    ><i class="bi bi-check"></i></button>
    <button
        type="button"
        class="input-group-text"
        @click="abort"
        @blur="blur($event)"
        tabindex="-1"
    ><i class="bi bi-x"></i></button>
  </div>
  <div
      v-if="!readOnly && error"
      class="invalid-tooltip d-block"
  >{{error}}</div>
  </div>
</template>

<style lang="scss">

@import "bootstrap/scss/functions";
@import "bootstrap/scss/variables";
@import "bootstrap/scss/variables-dark";
//@import "bootstrap/scss/maps";
@import "bootstrap/scss/mixins";
//@import "bootstrap/scss/utilities";
@import "bootstrap/scss/forms";

//@import "bootstrap/scss/bootstrap";


.flash-bg-enter-active {
  /* The vue framework checks for root-level transition-duration.
  Without this, the class is not automatically applied for the correct duration.
  Alternatively, :duration="ms" can be set on the Transition component. */
  transition-duration: 200ms;
}
.flash-bg-enter-active .osim-editable-text-value {
  transition: background-color 200ms ease-out !important;
}
.flash-bg-enter-from .osim-editable-text-value {
  background-color: #ff0000;
}
.flash-bg-leave-from, .flash-bg-leave-active, .flash-bg-leave-to {
  transition: none !important;
  display: none !important;
}

.osim-editable-text {
  // Nest these for specificity
  .osim-editable-text-value {
    //border-color: transparent; // TODO decide to keep the hovering effect?
    color: var(--bs-secondary-color);
  }
  .osim-editable-text-value:before {
    // Prevent field from collapsing when empty
    content: '\a0';
    display: inline-block;
    width: 0;
  }

  .osim-editable-text-pen {
    display: none;
  }
}

//.osim-editable-text:hover {  // TODO decide to keep the hovering effect?
.osim-editable-text {
  @extend .input-group; // Use pure CSS instead of JS for hover

  .osim-editable-text-value {
    @extend .form-control;
  }

  .osim-editable-text-pen {
    display: flex;
  }
}

</style>
