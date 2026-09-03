<template>
  <div class="pr-picker-section">
    <h3 class="section-title">Select PR Lines to Allocate</h3>

    <div v-if="loading" class="loading-state">
      Loading approved PR lines...
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button type="button" class="btn btn-outline btn-sm" @click="retryLoad">Retry</button>
    </div>

    <div v-else-if="availableLines.length === 0" class="empty-state">
      <p>No approved PR lines available for allocation.</p>
    </div>

    <div v-else class="table-container">
      <table class="picker-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                @click.stop
              />
            </th>
            <th>PR Number</th>
            <th>Line #</th>
            <th>Item Code</th>
            <th>Item Name</th>
            <th class="number-col">Qty Requested</th>
            <th class="number-col">Qty Allocated</th>
            <th class="number-col">Qty Remaining</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="line in availableLines"
            :key="line.id"
            :class="{ 'row-selected': isSelected(line.id) }"
          >
            <td class="checkbox-col">
              <input
                type="checkbox"
                :checked="isSelected(line.id)"
                @change="toggleLine(line.id)"
                @click.stop
              />
            </td>
            <td class="pr-number">{{ line.prNumber }}</td>
            <td class="line-no">{{ line.lineNo }}</td>
            <td class="item-code">{{ line.itemCode }}</td>
            <td class="item-name">{{ line.itemName }}</td>
            <td class="number-col">{{ line.qtyRequested }}</td>
            <td class="number-col">{{ line.qtyAllocated }}</td>
            <td class="number-col qty-remaining">
              {{ line.qtyRemaining }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  prLines: {
    type: Array,
    default: () => [],
  },
  selectedLineIds: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:selectedLineIds', 'retry']);

const availableLines = computed(() => {
  return props.prLines.map((line) => ({
    ...line,
    qtyRemaining:
      line.qtyRemaining ?? ((line.qtyRequested || 0) - (line.qtyAllocated || 0)),
  }));
});

const allSelected = computed(() => {
  return (
    props.selectedLineIds.length > 0 &&
    props.selectedLineIds.length === availableLines.value.length
  );
});

const isSelected = (lineId) => props.selectedLineIds.includes(lineId);

const toggleLine = (lineId) => {
  const nextSelectedLineIds = isSelected(lineId)
    ? props.selectedLineIds.filter((id) => id !== lineId)
    : [...props.selectedLineIds, lineId];

  emit('update:selectedLineIds', nextSelectedLineIds);
};

const toggleSelectAll = () => {
  const nextSelectedLineIds = allSelected.value
    ? []
    : availableLines.value.map((line) => line.id);

  emit('update:selectedLineIds', nextSelectedLineIds);
};

const retryLoad = () => {
  emit('retry');
};
</script>

<style scoped>
.pr-picker-section {
  background: var(--white);
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.loading-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

.error-state {
  padding: 16px;
  background: rgba(198, 40, 40, 0.08);
  border: 1px solid #c62828;
  border-radius: var(--radius-input);
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.error-message {
  color: #c62828;
  font-size: 14px;
  margin: 0;
}

.table-container {
  overflow-x: auto;
}

.picker-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.picker-table thead {
  background: var(--table-header);
  border-bottom: 2px solid var(--border);
}

.picker-table th {
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}

.picker-table td {
  padding: 12px 8px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

.checkbox-col {
  width: 40px;
  text-align: center;
  padding: 12px 4px;
}

.checkbox-col input {
  cursor: pointer;
}

.number-col {
  text-align: right;
  width: 120px;
}

.qty-remaining {
  font-weight: 600;
  background: rgba(255, 64, 129, 0.08);
}

.pr-number,
.line-no {
  font-family: monospace;
  font-size: 13px;
  color: var(--text-muted);
}

.item-code {
  font-weight: 500;
  color: var(--primary);
}

.row-selected {
  background: rgba(255, 64, 129, 0.05);
}

.btn {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: var(--radius-btn);
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:hover {
  opacity: 0.85;
}

.btn-outline {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
