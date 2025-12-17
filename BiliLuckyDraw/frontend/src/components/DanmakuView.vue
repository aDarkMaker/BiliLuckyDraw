<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { EventsOn, EventsOff } from '../../wailsjs/runtime/runtime';
import {
    DrawWinners,
    SetBiliCookie,
    StartCollect,
    StartDanmaku,
    StopCollect,
    StopDanmaku,
} from '../../wailsjs/go/main/App';

const roomId = ref('');
const logs = ref<string[]>([]);
const keyword = ref('');
const count = ref(1);
const winners = ref<{ uid: number; uname: string }[]>([]);
const collecting = ref(false);
const poolCount = ref(0);
const connected = ref(false);
const lastError = ref('');
const showDebug = ref(false);
const debug = ref<string[]>([]);
let off1: any;
let off2: any;
let off3: any;
let off4: any;
let off5: any;

function loadRoomId() {
    roomId.value = localStorage.getItem('biliRoomId') ?? '';
}

function loadPrefs() {
    keyword.value = localStorage.getItem('biliKeyword') ?? '';
    const n = Number(localStorage.getItem('biliWinnerCount') ?? '1');
    count.value = Number.isFinite(n) && n > 0 ? n : 1;
}

function savePrefs() {
    localStorage.setItem('biliKeyword', keyword.value);
    localStorage.setItem('biliWinnerCount', String(count.value));
}

async function start() {
    loadRoomId();
    const id = Number(roomId.value);
    if (!id) {
        alert('请先在设置里保存房间号');
        return;
    }
    lastError.value = '';
    await SetBiliCookie(localStorage.getItem('biliCookie') ?? '');
    await StartDanmaku(id);
    connected.value = true;
}

async function stop() {
    await StopDanmaku();
    connected.value = false;
    collecting.value = false;
}

function startCollect() {
    if (!connected.value) {
        alert('请先连接直播间');
        return;
    }
    collecting.value = true;
    savePrefs();
    StartCollect(keyword.value);
}

function stopCollect() {
    collecting.value = false;
    StopCollect();
}

async function draw() {
    savePrefs();
    const n = Number(count.value) || 0;
    winners.value = await DrawWinners(n);
}

onMounted(() => {
    loadRoomId();
    loadPrefs();

    off1 = EventsOn('danmaku', (p: any) => {
        logs.value.unshift(`${p.cmd} room=${p.roomId}`);
        logs.value = logs.value.slice(0, 50);
    });

    off2 = EventsOn('danmaku_error', (e: any) => {
        lastError.value = e.error ?? '';
        logs.value.unshift(`ERROR: ${e.error}`);
        connected.value = false;
    });

    off3 = EventsOn('danmu_msg', (p: any) => {
        logs.value.unshift(`${p.uname}(${p.uid}): ${p.text}`);
        logs.value = logs.value.slice(0, 50);
    });

    off4 = EventsOn('collect_status', (p: any) => {
        poolCount.value = p.count ?? 0;
        collecting.value = !!p.enabled;
    });

    off5 = EventsOn('danmaku_debug', (p: any) => {
        debug.value.unshift(JSON.stringify(p));
        debug.value = debug.value.slice(0, 100);
    });
});

onBeforeUnmount(() => {
    if (off1) EventsOff('danmaku');
    if (off2) EventsOff('danmaku_error');
    if (off3) EventsOff('danmu_msg');
    if (off4) EventsOff('collect_status');
    if (off5) EventsOff('danmaku_debug');
});
</script>

<template>
    <div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap">
            <div>房间号：{{ roomId || '未设置' }}</div>
            <div>连接：{{ connected ? '已连接' : '未连接' }}</div>
            <button :disabled="connected" @click="start">连接</button>
            <button :disabled="!connected" @click="stop">断开</button>
            <button @click="showDebug = !showDebug">调试</button>
            <div v-if="lastError" style="color: #ff6b6b">错误：{{ lastError }}</div>
        </div>

        <div v-if="showDebug" style="margin-top: 12px">
            <div style="display: flex; gap: 8px; align-items: center">
                <div>Debug</div>
                <button @click="debug = []">清空</button>
            </div>
            <pre
                style="
                    max-height: 240px;
                    overflow: auto;
                    background: #111;
                    color: #ddd;
                    padding: 8px;
                "
                >{{ debug.join('\n') }}
            </pre>
        </div>

        <div style="display: flex; gap: 8px; align-items: center; margin-top: 12px">
            <input v-model="keyword" placeholder="指定弹幕（留空=全部）" />
            <button :disabled="collecting" @click="startCollect">开启抽奖</button>
            <button :disabled="!collecting" @click="stopCollect">结束收集</button>
            <div>人数：{{ poolCount }}</div>
        </div>

        <div style="display: flex; gap: 8px; align-items: center; margin-top: 12px">
            <input v-model.number="count" type="number" min="1" style="width: 80px" />
            <button :disabled="poolCount === 0" @click="draw">抽奖</button>
        </div>

        <ul v-if="winners.length" style="margin-top: 12px">
            <li v-for="w in winners" :key="w.uid">{{ w.uname }} ({{ w.uid }})</li>
        </ul>

        <ul>
            <li v-for="(x, i) in logs" :key="i">
                {{ x }}
            </li>
        </ul>
    </div>
</template>
