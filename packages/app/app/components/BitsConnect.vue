<template>
  <EvmConnectDialog class-name="bits-connect">
    <template #default>
      <span>Connect</span>
    </template>
    <template #connected="{ address: connectedAddress }">
      <span>{{ shortAddress(connectedAddress) }}</span>
    </template>
  </EvmConnectDialog>
</template>
