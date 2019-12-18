<template>
  <div>
    <dr-agenda
      :settings="{
        fn: log,
        interval: '00:30',
        fnEvent: log,
      }"
      :events="[
        {
          title: 'Teste',
          subtitle: 'Subtítulo',
          date: (new Date('12/18/2019 14:00')).toISOString(),
          duration: 30,
          obj: {
            teste: 'teste',
          },
        },
      ]"
    />
    <dr-calendar v-if="false" />
  </div>
</template>

<script>
import moment from 'moment';
import DrAgenda from './components/DrAgenda.vue';
import DrCalendar from './components/DrCalendar.vue';

export default {
  name: 'App',

  components: {
    DrAgenda,
    DrCalendar,
  },

  methods: {
    log(event, datetime, obj = null) {
      console.log('event is', event);
      console.log('datetime is', datetime);
      console.log('formatted datetime is', moment(datetime).format('YYYY-MM-d HH:mm:ss'));
      console.log('obj is', obj);
    },
  },
};
</script>
