<template>
  <div>
    <dr-calendar
      v-if="true"
      v-model="selectedDate"
      @change="calendarFn"
    />

    <hr>

    <div>
      <button @click="doIt()">
        change selected date
      </button>

      <br>

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
        start: '08:00',
        end: '20:00',
        interval: '00:15',
        fnEvent: log,
        daysView: daysView,
        scrollToTime: true,
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
      selectedDate: moment('2020-08-08', 'YYYY-MM-DD', true).toISOString(),
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

    calendarFn(date) {
      console.log(date);
    },

    doIt() {
      this.selectedDate = moment(this.selectedDate).add(1, 'month').toISOString();
    },
  },
};
</script>
