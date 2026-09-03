<template>
  <div class="form-section">
    <h3 class="form-section-title">Purchase Order Details</h3>
    
    <div class="form-group">
      <label for="vendor-name" class="form-label">Vendor Name *</label>
      <input
        id="vendor-name"
        v-model="form.vendorName"
        type="text"
        class="form-input"
        placeholder="Enter vendor name"
        required
      />
      <span v-if="errors.vendorName" class="form-error">
        {{ errors.vendorName }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  vendorName: {
    type: String,
    default: '',
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:vendorName']);

const form = {
  get vendorName() {
    return props.vendorName;
  },
  set vendorName(value) {
    emit('update:vendorName', value);
  },
};
</script>

<style scoped>
.form-section {
  background: var(--white);
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  margin-bottom: 24px;
}

.form-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.form-input {
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-input);
  background: var(--bg);
  color: var(--text);
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(255, 64, 129, 0.1);
}

.form-error {
  font-size: 13px;
  color: #c62828;
  margin-top: 4px;
}
</style>
