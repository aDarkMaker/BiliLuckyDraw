<script setup lang="ts">
import { ref, onMounted } from 'vue';

const roomId = ref('');
const cookie = ref('');

onMounted(() => {
    roomId.value = localStorage.getItem('biliRoomId') ?? '';
    cookie.value = localStorage.getItem('biliCookie') ?? '';
});

function save() {
    localStorage.setItem('biliRoomId', roomId.value.trim());
    localStorage.setItem('biliCookie', cookie.value.trim());
    alert('已保存房间号');
}
</script>

<template>
    <div>
        <h3>设置</h3>
        <label>
            房间号：
            <input v-model="roomId" placeholder="例如 123456" />
        </label>
        <label>
            Cookie：
            <input v-model="cookie" placeholder="粘贴 SESSDATA=... 或整段 Cookie" />
        </label>
        <button @click="save">保存</button>
    </div>
</template>
