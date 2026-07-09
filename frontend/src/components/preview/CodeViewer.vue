<template>
  <div class="code-viewer">
    <div class="toolbar">
      <select v-model="selectedLanguage" @change="highlightCode">
        <option v-for="lang in languages" :key="lang" :value="lang">
          {{ lang }}
        </option>
      </select>
      <button @click="copyCode" class="copy-btn">
        {{ copied ? '已复制' : '复制代码' }}
      </button>
    </div>
    <div class="code-container">
      <pre><code ref="codeElement" :class="'language-' + selectedLanguage">{{ code }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/github-dark.css';

// 注册需要的语言
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdown);

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'javascript'
  }
});

const codeElement = ref(null);
const selectedLanguage = ref(props.language);
const copied = ref(false);

const languages = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'sql', 'bash',
  'json', 'xml', 'html', 'css', 'yaml', 'markdown'
];

const highlightCode = async () => {
  await nextTick();
  if (codeElement.value) {
    hljs.highlightElement(codeElement.value);
  }
};

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('复制失败:', err);
  }
};

onMounted(() => {
  highlightCode();
});

watch(() => props.code, () => {
  highlightCode();
});

watch(() => props.language, (newLang) => {
  selectedLanguage.value = newLang;
  highlightCode();
});
</script>

<style scoped>
.code-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar select {
  padding: 5px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
}

.copy-btn {
  padding: 5px 15px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.copy-btn:hover {
  opacity: 0.9;
}

.code-container {
  flex: 1;
  overflow: auto;
  background: #1e1e1e;
  padding: 15px;
  margin: 0;
}

pre {
  margin: 0;
  padding: 0;
  background: transparent;
}

code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  background: transparent;
}
</style>