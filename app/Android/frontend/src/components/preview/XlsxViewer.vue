<template>
  <div class="xlsx-viewer">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="xlsx-container">
      <div class="sheet-tabs">
        <button
          v-for="(sheet, index) in sheets"
          :key="index"
          @click="activeSheet = index"
          :class="{ active: activeSheet === index }"
        >
          {{ sheet.name }}
        </button>
      </div>
      <div class="table-container">
        <table v-if="sheets[activeSheet]">
          <thead>
            <tr>
              <th v-for="(cell, cellIndex) in sheets[activeSheet].headers" :key="cellIndex">
                {{ cell }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in sheets[activeSheet].rows" :key="rowIndex">
              <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as XLSX from 'xlsx';

const props = defineProps({
  url: {
    type: String,
    required: true
  }
});

const loading = ref(true);
const error = ref('');
const sheets = ref([]);
const activeSheet = ref(0);

const loadXlsx = async () => {
  try {
    loading.value = true;
    error.value = '';

    const response = await fetch(props.url);
    const arrayBuffer = await response.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    sheets.value = workbook.SheetNames.map(name => {
      const worksheet = workbook.Sheets[name];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length === 0) {
        return { name, headers: [], rows: [] };
      }

      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      return { name, headers, rows };
    });

    loading.value = false;
  } catch (err) {
    error.value = `加载Excel文件失败: ${err.message}`;
    loading.value = false;
  }
};

onMounted(() => {
  loadXlsx();
});

watch(() => props.url, () => {
  loadXlsx();
});
</script>

<style scoped>
.xlsx-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 8px;
  overflow: hidden;
}

.loading, .error {
  padding: 20px;
  text-align: center;
}

.error {
  color: var(--color-error);
}

.xlsx-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sheet-tabs {
  display: flex;
  gap: 5px;
  padding: 10px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.sheet-tabs button {
  padding: 5px 15px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.sheet-tabs button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.table-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

thead {
  background: var(--bg-secondary);
  position: sticky;
  top: 0;
  z-index: 10;
}

th, td {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  text-align: left;
}

th {
  font-weight: 600;
}

tbody tr:hover {
  background: var(--bg-secondary);
}
</style>