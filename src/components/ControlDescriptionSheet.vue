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
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
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
  }
</style>
