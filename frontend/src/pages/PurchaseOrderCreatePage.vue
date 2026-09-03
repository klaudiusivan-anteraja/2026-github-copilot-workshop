<template>
  <section>
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/purchase-orders" class="back-btn" title="Back to PO List">&#8592;</RouterLink>
        <div>
          <h2>Create Purchase Order</h2>
          <p class="muted">Allocate approved requisition lines to a new purchase order</p>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <form @submit.prevent="handleSubmit" class="form-container">
      <!-- Vendor Information -->
      <VendorHeadingForm
        v-model:vendorName="form.vendorName"
        :errors="fieldErrors"
      />

      <!-- PR Line Selection -->
      <PRLinePicker
        :prLines="availablePrLines"
        :selectedLineIds="selectedLineIds"
        :loading="loadingPrLines"
        :error="errorLoadingPrLines"
        @update:selectedLineIds="selectedLineIds = $event"
        @retry="loadPrLines"
      />

      <!-- Line Allocation Details -->
      <LineAllocationForm
        :selectedLines="selectedLines"
        :errors="lineAllocationErrors"
        @remove-line="onRemoveLine"
      />

      <!-- Form Actions -->
      <div class="form-actions">
        <RouterLink to="/purchase-orders" class="btn btn-outline">
          Cancel
        </RouterLink>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isFormValid || isSubmitting"
        >
          <span v-if="isSubmitting">Creating...</span>
          <span v-else>Create Purchase Order</span>
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { api } from '../api';
import VendorHeadingForm from '../components/VendorHeadingForm.vue';
import PRLinePicker from '../components/PRLinePicker.vue';
import LineAllocationForm from '../components/LineAllocationForm.vue';

const router = useRouter();

// Form state
const form = ref({
  vendorName: '',
});

const selectedLineIds = ref([]);
const availablePrLines = ref([]);
const selectedLines = ref([]);
const isSubmitting = ref(false);
const errorMessage = ref('');
const fieldErrors = ref({});
const loadingPrLines = ref(false);
const errorLoadingPrLines = ref('');
const lineAllocationErrors = ref([]);

const getLineErrors = (line) => {
  const errors = {};

  if (!line.qtyOrdered || line.qtyOrdered <= 0) {
    errors.qtyOrdered = 'Quantity must be greater than 0';
  } else if (line.qtyOrdered > line.qtyRemaining) {
    errors.qtyOrdered = `Quantity cannot exceed remaining ${line.qtyRemaining}`;
  }

  if (line.unitPrice < 0) {
    errors.unitPrice = 'Unit price cannot be negative';
  }

  return errors;
};

const syncLineAllocationErrors = () => {
  lineAllocationErrors.value = selectedLines.value.map((line) => getLineErrors(line));
};

// Computed properties
const isFormValid = computed(() => {
  if (!form.value.vendorName.trim()) {
    return false;
  }

  if (selectedLines.value.length === 0) {
    return false;
  }

  // Check that all lines have valid qty and price
  return selectedLines.value.every(
    (line) =>
      line.qtyOrdered > 0 &&
      line.qtyOrdered <= line.qtyRemaining &&
      line.unitPrice >= 0
  );
});

// Methods
const loadPrLines = async () => {
  loadingPrLines.value = true;
  errorLoadingPrLines.value = '';

  try {
    const requisitions = await api.listRequisitions();
    const approvedRequisitions = (requisitions.items || []).filter(
      (requisition) => requisition.status === 'APPROVED'
    );
    const openLinePayloads = await Promise.all(
      approvedRequisitions.map((requisition) =>
        api.getRequisitionOpenLines(requisition.id)
      )
    );

    availablePrLines.value = openLinePayloads.flatMap(({ requisition, openLines }) =>
      openLines.map((line) => ({
        ...line,
        prNumber: requisition.prNumber,
        qtyRemaining: line.qtyOpenForPo,
      }))
    );
  } catch (error) {
    errorLoadingPrLines.value =
      error.message || 'Failed to load PR lines. Please try again.';
  } finally {
    loadingPrLines.value = false;
  }
};

const updateSelectedLines = () => {
  // Build selectedLines array from selectedLineIds
  const updated = selectedLineIds.value.map((lineId) => {
    const existingLine = selectedLines.value.find((l) => l.id === lineId);
    const prLine = availablePrLines.value.find((l) => l.id === lineId);

    if (existingLine) {
      return existingLine;
    }

    return {
      id: lineId,
      ...prLine,
      qtyOrdered: 0,
      unitPrice: prLine.estUnitPrice || 0,
      requiredDate: prLine.requiredDate || '',
    };
  });

  selectedLines.value = updated;
};

const onRemoveLine = (index) => {
  const line = selectedLines.value[index];
  if (!line) {
    return;
  }

  const lineId = line.id;
  selectedLines.value = selectedLines.value.filter((_, currentIndex) => currentIndex !== index);
  lineAllocationErrors.value = lineAllocationErrors.value.filter(
    (_, currentIndex) => currentIndex !== index
  );
  selectedLineIds.value = selectedLineIds.value.filter((id) => id !== lineId);
};

const validateForm = () => {
  fieldErrors.value = {};
  lineAllocationErrors.value = [];
  let isValid = true;

  // Validate vendor name
  if (!form.value.vendorName.trim()) {
    fieldErrors.value.vendorName = 'Vendor name is required';
    isValid = false;
  }

  // Validate each line
  selectedLines.value.forEach((line, index) => {
    const errors = getLineErrors(line);

    if (Object.keys(errors).length > 0) {
      lineAllocationErrors.value[index] = errors;
      isValid = false;
    }
  });

  return isValid;
};

const handleSubmit = async () => {
  errorMessage.value = '';

  if (!validateForm()) {
    errorMessage.value = 'Please fix the errors above';
    return;
  }

  isSubmitting.value = true;

  try {
    const payload = {
      vendorName: form.value.vendorName.trim(),
      lines: selectedLines.value.map((line) => ({
        prLineId: line.id,
        itemCode: line.itemCode,
        itemName: line.itemName,
        qtyOrdered: line.qtyOrdered,
        unitPrice: line.unitPrice,
        uom: line.uom,
        siteCode: line.siteCode || '',
        requiredDate: line.requiredDate || null,
      })),
    };

    const result = await api.createPurchaseOrder(payload);
    await router.push(`/purchase-orders/${result.id}`);
  } catch (error) {
    errorMessage.value =
      error.message || 'Failed to create purchase order. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

// Watchers
watch(selectedLineIds, updateSelectedLines, { deep: true });
watch(selectedLines, syncLineAllocationErrors, { deep: true, immediate: true });

// Lifecycle
onMounted(loadPrLines);
</script>

<style scoped>
section {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.page-header-left {
  display: flex;
  gap: 16px;
  flex: 1;
}

.page-header-left div {
  flex: 1;
}

.page-header-left h2 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
}

.page-header-left .muted {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--white);
  text-decoration: none;
  border: none;
  transition: opacity 0.15s;
  font-size: 20px;
}

.back-btn:hover {
  opacity: 0.85;
}

.error {
  padding: 12px 16px;
  margin-bottom: 20px;
  background: rgba(198, 40, 40, 0.08);
  border: 1px solid #c62828;
  border-radius: var(--radius-input);
  color: #c62828;
  font-size: 14px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-btn);
  cursor: pointer;
  transition: opacity 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.btn:hover {
  opacity: 0.85;
}

.btn-outline {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text);
}

.btn-primary {
  background: var(--primary);
  color: var(--white);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
