<template>
  <div class="hero">
    <header>
      <h1>
        <img src="logo.svg" /><span v-html="$t('hero.title')" />
      </h1>
      <p class="subtitle" v-html="$t('hero.subtitle')"/>
    </header>

    <div class="instructions">
      {{$t('messages.emptyMap')}}
    </div>
  </div>
</template>

<script>
export default {
  name: 'hero',
  props: {},
  data () {
    return {}
  }
}
</script>

<style scoped>
  .hero {
    background-color: hsla(200, 10%, 75%, 0.2);
    padding: 4em;
    border-radius: 1em;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  h1 {
    display: flex;
    flex-direction: row;
    font-size: 72px;
    color: hsl(313, 50%, 60%);
    text-transform: uppercase;
    margin-bottom: 0;
  }

  h1 img {
    color: hsl(313, 61%, 44%);
    height: 250px;
    margin-top: 10px;
    margin-right: 48px;
  }

  p.subtitle {
    margin-top: 0;
    font-style: italic;
    font-weight: bold;
    font-size: 35px;
    color: #888;
  }

  .instructions {
    color: #888;
    font-size: 24px;
    text-align: center;
  }
</style>
