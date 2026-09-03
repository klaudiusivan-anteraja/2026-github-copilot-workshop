<template>
  <section>
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/" class="back-btn" title="Back to Dashboard">&#8592;</RouterLink>
        <div>
          <h2>Purchase Orders</h2>
          <p class="muted">All purchase order records</p>
        </div>
      </div>
      <RouterLink class="btn btn-outline" to="/purchase-orders/new">+ New PO</RouterLink>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="card-panel">
      <p v-if="loading" class="muted">Loading purchase orders...</p>
      <div v-else-if="errorMessage" class="empty-state">
        <p>Purchase orders could not be loaded.</p>
        <button class="btn btn-outline" type="button" @click="load">Retry</button>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        <p>No purchase orders found.</p>
        <RouterLink class="btn btn-primary" to="/purchase-orders/new">Create the first PO</RouterLink>
      </div>
      <table v-else>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Vendor</th>
            <th>PR Number</th>
            <th>Requester</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td><RouterLink :to="`/purchase-orders/${item.id}`">{{ item.poNumber }}</RouterLink></td>
            <td>{{ item.vendorName }}</td>
            <td>{{ item.prNumber || '-' }}</td>
            <td>{{ item.requesterName || '-' }}</td>
            <td>
              <span class="status-badge" :class="item.status.toLowerCase()">{{ item.status }}</span>
            </td>
            <td>{{ item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../api';

const items = ref([]);
const errorMessage = ref('');
const loading = ref(false);

async function load() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const payload = await api.listPurchaseOrders();
    items.value = payload.items || [];
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load purchase orders';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  text-align: center;
}

.empty-state p {
  margin: 0;
  color: var(--text-muted);
}
</style>
