<template>
  <UError
    redirect="/artisan/maker"
    :error="{
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Sorry, the page you are looking for does not exist.',
    }"
  />
</template>
