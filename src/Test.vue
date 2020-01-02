<template>
  <div>
    <dr-calendar
      v-if="true"
      :fn="calendarFn"
    />

    <hr>

    <div>
      <code>daysView:</code>
      <select v-model="daysView">
        <option
          v-for="n in 7"
          :key="n"
          :value="n"
          :selected="n === daysView"
        >
          {{ n }}
        </option>
      </select>
    </div>

    <hr>

    <dr-agenda
      :selected-date="selectedDate"
      :settings="{
        fn: log,
        interval: '00:30',
        fnEvent: log,
        daysView: daysView,
        scrollToTime: false,
      }"
      :events="[
        {
          title: 'Teste',
          subtitle: 'Subtítulo',
          date: today,
          duration: 30,
          obj: {
            teste: 'teste',
          },
        },
      ]"
    />
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

  data() {
    return {
      today: (new Date().toISOString()),
      selectedDate: (new Date()).toISOString(),
      daysView: 7,
    };
  },

  methods: {
    log(event, datetime, obj = null) {
      console.log('event is', event);
      console.log('datetime is', datetime);
      console.log('formatted datetime is', moment(datetime).format('YYYY-MM-d HH:mm:ss'));
      console.log('obj is', obj);
    },

    calendarFn(date, event) {
      console.log(date);
      console.log(event);
      this.selectedDate = date;
    },
  },
};
</script>
