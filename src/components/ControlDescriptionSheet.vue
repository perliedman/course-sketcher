<template>
  <table>
    <tbody>
      <tr>
        <td colspan="8">{{event.name}}</td>
      </tr>
      <tr>
        <td colspan="8">{{course.name}}</td>
      </tr>
      <tr>
        <td colspan="3">{{course.id}}</td>
        <td colspan="3">{{course.distance().toFixed(1)}} km</td>
        <td colspan="2"></td>
      </tr>
      <tr v-for="(c, i) in course.controls" :key="i">
        <td>{{i > 0 ? i : ''}}</td>
        <td>{{c.code}}</td>
        <td><img v-if="c.description.C" :src="`iof-2004/${c.description.C}.svg`" /></td>
        <td><img v-if="c.description.D" :src="`iof-2004/${c.description.D}.svg`" /></td>
        <td><img v-if="c.description.E" :src="`iof-2004/${c.description.E}.svg`" /></td>
        <td><img v-if="c.description.F" :src="`iof-2004/${c.description.F}.svg`" /></td>
        <td><img v-if="c.description.G" :src="`iof-2004/${c.description.G}.svg`" /></td>
        <td><img v-if="c.description.H" :src="`iof-2004/${c.description.H}.svg`" /></td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  name: 'ControlDescriptionSheet',
  props: {
    event: Object,
    course: Object
  }    
}
</script>

<style scoped>
  table {
    border-collapse: collapse;
  }

  td {
    text-align: center;
    border: 2px solid black;
    color: black;
    min-width: 2.5em;
    padding: 0.2em;
  }
</style>
