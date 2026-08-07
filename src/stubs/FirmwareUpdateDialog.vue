<!-- Stub for `@/components/dialogs/FirmwareUpdateDialog.vue`. Real DWC dialog UI isn't reproduced
     here - a plugin under test only needs something that mounts and honours the same v-model/props/
     events, so its own logic around opening/closing the dialog can be exercised. -->
<template>
	<div v-if="shown" class="test-stub-firmware-update-dialog">Firmware update dialog stub</div>
</template>

<script setup lang="ts">
defineProps<{ shown: boolean; plan: unknown }>();
defineEmits<{ "update:shown": [boolean]; confirmed: []; cancelled: [] }>();
</script>
