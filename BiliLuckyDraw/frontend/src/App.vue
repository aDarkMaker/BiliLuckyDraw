<script lang="ts" setup>
import { ref } from 'vue';
import DanmakuView from './components/DanmakuView.vue';
import Settings from './components/settings.vue';

const tab = ref<'danmaku' | 'settings'>('danmaku');
</script>

<template>
    <div style="padding: 16px">
        <div style="display: flex; gap: 8px; margin-bottom: 12px">
            <button @click="tab = 'danmaku'">弹幕</button>
            <button @click="tab = 'settings'">设置</button>
        </div>

        <DanmakuView v-if="tab === 'danmaku'" />
        <Settings v-else />
    </div>
</template>
