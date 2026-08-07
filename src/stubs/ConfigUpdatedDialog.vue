<!-- Stub for `@/components/dialogs/ConfigUpdatedDialog.vue`. See FirmwareUpdateDialog.vue's stub
     for why the real dialog UI isn't reproduced here. -->
<template>
	<div v-if="shown" class="test-stub-config-updated-dialog">Config updated dialog stub</div>
</template>

<script setup lang="ts">
defineProps<{ shown: boolean }>();
defineEmits<{ "update:shown": [boolean] }>();
</script>
