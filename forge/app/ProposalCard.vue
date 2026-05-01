<script setup lang="ts">
import { ref } from 'vue'
import type { Proposal, CheapVerdict, ModelTier } from '../server/schema'
import IconPreview from './IconPreview.vue'

const props = defineProps<{
  proposal: Proposal
  verdict: CheapVerdict
  index: number
  selected: boolean
  refining: boolean
  refinedFrom?: ModelTier
  loopMode: 'loop' | 'hover'
  /** 1-based pick order when the card is part of a multi-selection (1 = first / default). */
  selectionRank?: number
  /** Variant name this card will write as (`default`, `alt`, `alt-2`, …) when saved. */
  variantName?: string
}>()

const emit = defineEmits<{
  select: [index: number]
  refine: [index: number, instruction: string]
}>()

const showRefineInput = ref(false)
const instruction = ref('')

function onCardClick() {
  emit('select', props.index)
  showRefineInput.value = !showRefineInput.value
}

function onRefineSubmit() {
  const text = instruction.value.trim()
  if (!text) return
  emit('refine', props.index, text)
  instruction.value = ''
  showRefineInput.value = false
}
</script>

<template>
  <div
    class="card"
    :class="{ selected, cheap: !verdict.passed, refining }"
  >
    <button class="card-body" @click="onCardClick" :disabled="refining">
      <div class="header">
        <span class="num">{{ index + 1 }}</span>
        <span class="title">{{ proposal.title }}</span>
        <span v-if="selectionRank" class="badge selection-rank">
          #{{ selectionRank }}<span v-if="variantName"> · {{ variantName }}</span>
        </span>
        <span v-if="refinedFrom" class="badge refined">refined</span>
        <span v-if="!verdict.passed" class="badge cheap-badge">cheap?</span>
      </div>
      <div class="preview-wrap">
        <IconPreview
          :proposal="proposal"
          :size="120"
          :mode="loopMode"
        />
        <div v-if="refining" class="refining-overlay">
          <div class="spinner-mini" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <span>refining…</span>
        </div>
      </div>
      <p class="desc">{{ proposal.description }}</p>
      <details v-if="!verdict.passed" class="reasons" @click.stop>
        <summary>Detector flags ({{ verdict.reasons.length }})</summary>
        <ul>
          <li v-for="r in verdict.reasons" :key="r">{{ r }}</li>
        </ul>
      </details>
    </button>

    <div v-if="showRefineInput && !refining" class="refine">
      <textarea
        v-model="instruction"
        placeholder="What to change? e.g. make the sparkles smaller, slow down the wand swing, swap which path moves first…"
        rows="2"
        @keydown.meta.enter="onRefineSubmit"
        @keydown.ctrl.enter="onRefineSubmit"
      />
      <div class="refine-actions">
        <span class="hint">⌘/Ctrl+Enter to submit</span>
        <button class="refine-btn" @click="onRefineSubmit" :disabled="!instruction.trim()">
          Refine →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  border: 2px solid #e5e5e5;
  border-radius: 16px;
  background: white;
  transition: border-color 0.15s, transform 0.15s;
  min-width: 0;
}
.card:hover { border-color: #888; }
.card.selected { border-color: #2563eb; }
.card.cheap { border-style: dashed; }
.card.refining { opacity: 0.85; }

.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
}
.card-body:disabled { cursor: not-allowed; }

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: stretch;
}
.num {
  width: 24px; height: 24px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: #111; color: white;
  font-size: 12px; font-weight: 600;
  flex-shrink: 0;
}
.title { font-weight: 600; flex: 1; font-size: 14px; }
.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
}
.cheap-badge { background: #fee2e2; color: #991b1b; }
.refined { background: #dbeafe; color: #1e40af; }
.selection-rank { background: #2563eb; color: white; }

.preview-wrap { position: relative; }
.refining-overlay {
  position: absolute;
  inset: 0;
  display: flex; align-items: center; justify-content: center;
  flex-direction: column;
  gap: 8px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  font-size: 12px;
  color: #555;
}
.spinner-mini { display: inline-flex; align-items: flex-end; gap: 3px; height: 14px; }
.spinner-mini span {
  width: 3px; background: #111; border-radius: 2px;
  animation: bounce-mini 1.1s ease-in-out infinite;
}
.spinner-mini span:nth-child(1) { animation-delay: 0s; }
.spinner-mini span:nth-child(2) { animation-delay: 0.15s; }
.spinner-mini span:nth-child(3) { animation-delay: 0.3s; }
@keyframes bounce-mini {
  0%, 100% { height: 4px; }
  50%      { height: 14px; }
}

.desc {
  font-size: 13px;
  color: #444;
  line-height: 1.45;
  margin: 0;
  align-self: stretch;
  text-align: left;
}
.reasons {
  font-size: 12px;
  color: #991b1b;
  align-self: stretch;
}
.reasons ul { margin: 6px 0 0 0; padding-left: 16px; }

.refine {
  border-top: 1px solid #eee;
  padding: 12px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.refine textarea {
  width: 100%;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  border: 1px solid #ccc;
  border-radius: 6px;
  resize: vertical;
}
.refine textarea:focus { outline: none; border-color: #2563eb; }
.refine-actions {
  display: flex; justify-content: space-between; align-items: center;
}
.hint { font-size: 11px; color: #888; }
.refine-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  background: #2563eb;
  color: white;
  cursor: pointer;
}
.refine-btn:hover { background: #1d4ed8; }
.refine-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
