<template>
  <EvmConnectDialog class-name="bits-connect">
    <template #default>
      <span>Connect</span>
    </template>
    <template #connected="{ address: connectedAddress }">
      <span v-if="connectedAddress">{{ shortAddress(connectedAddress) }}</span>
    </template>
  </EvmConnectDialog>
</template>
