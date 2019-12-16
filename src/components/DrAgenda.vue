<template>
  <article class="dr-agenda">
    <header class="dr-agenda__header">
      <div class="dr-agenda__header-wrapper">
        <div
          v-for="(weekday, index) in config.weekdays"
          :key="`weekday${index}`"
          :class="[weekday.className, `dr-agenda__weekday--${config.daysView}`]"
          class="dr-agenda__weekday"
        >
          <span class="dr-agenda__weekday-name">
            {{ weekday.weekdayName | toFirstLetters(3) }}
          </span>

          <span class="dr-agenda__weekday-date">
            {{ weekday.date.format('D') }}
          </span>
        </div>
      </div>
    </header>

    <section class="dr-agenda__body">
      <div class="dr-agenda__periods">
        <div
          v-for="i in config.grid.rows"
          :key="`time-${i}`"
          class="dr-agenda__periods-time"
        >
          <span>
            {{ i | toTime(config.interval, config.start) }}
          </span>
        </div>

        <div class="dr-agenda__periods-time" />
      </div>

      <div class="dr-agenda__timetable">
        <div class="dr-agenda__grid">
          <div
            v-for="d in config.grid.columns"
            :key="`grid-column_${d}`"
            :datetime="config.weekdays[d - 1].datetime"
            :class="`dr-agenda__grid-column--${config.daysView}`"
            class="dr-agenda__grid-column"
          >
            <div
              v-for="h in config.grid.rows + 1"
              :key="`grid-cell_${d}-${h}`"
              :datetime="setDatetime(config.weekdays[d - 1].datetime, h)"
              class="dr-agenda__grid-cell"
              @click="callFunction($event)"
            />
          </div>
        </div>
      </div>
    </section>
  </article>
</template>

<script>
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const settings = {
  interval: '01:00',
  start: '00:00',
  end: '23:00',
  daysView: 7,
};

export default {
  name: 'DrAgenda',

  filters: {
    toFirstLetters(value, n) {
      return String(value).substring(0, n);
    },

    toTime(value, interval, start) {
      const total = (value * interval) + start;
      const hours = Math.floor(total / 60);
      const minutes = total % 60;

      return `${String(hours).padStart(2, 0)}:${String(minutes).padStart(2, 0)}`;
    },
  },

  props: {
    selectedDate: {
      type: String,
      required: true,
      default: () => (new Date()).toISOString(),
    },

    events: {
      type: Array,
      required: false,
      default: () => [],
    },

    settings: {
      type: Object,
      required: false,
      default: () => ({ ...settings }),
    },
  },

  data() {
    return {
      counter: null,
      now: moment(),
    };
  },

  computed: {
    config() {
      const copy = { ...settings };
      Object.keys(this.settings).forEach(key => delete copy[key]);

      const config = { ...this.settings, ...copy };
      config.interval = moment.duration(config.interval).asMinutes();
      config.interval = (config.interval > 0) ? config.interval : 60;
      config.start = moment.duration(config.start).asMinutes();
      config.end = moment.duration(config.end).asMinutes();
      config.today = moment().startOf('d');
      config.selectedDate = moment(this.selectedDate).startOf('d');
      config.weekdays = this.getWeekdays(config.daysView, config.selectedDate);
      config.grid = {
        columns: config.daysView,
        rows: Math.floor((config.end - config.start) / config.interval),
      };
      config.fn = ('fn' in this.settings) ? this.settings.fn : this.selectDatetime;

      return config;
    },
  },

  watch: {
    now: {
      deep: true,
      immediate: false,
      handler(value) {
        this.updateTimeMarker(value);
      },
    },

    config: {
      deep: true,
      immediate: false,
      handler() {
        this.$nextTick(() => this.init());
      },
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.init();
    });
  },

  destroyed() {
    clearInterval(this.counter);
  },

  methods: {
    init() {
      if (this.createTimeMarker()) {
        this.counter = setInterval(() => { this.now = moment(); }, 60000);
      }
      this.placeEvents();
    },

    selectDatetime(time, cell) {
      const all = document.querySelectorAll('.dr-agenda__grid-cell');
      all.forEach(item => item.classList.remove('dr-agenda__grid-cell--selected'));
      cell.target.classList.add('dr-agenda__grid-cell--selected');
    },

    callFunction(event) {
      this.config.fn(event.target.getAttribute('datetime'), event);
    },

    setDatetime(day, time = 0) {
      let hours = 0;
      let minutes = 0;
      const date = moment(day);

      if (time > 0) {
        const total = (time * this.config.interval) + this.config.start;
        hours = Math.floor(total / 60);
        minutes = total % 60;
      }

      date.hours(hours).minutes(minutes);
      return date.toISOString();
    },

    createTimeMarker() {
      this.destroyTimeMarker();
      const now = moment(this.config.today).startOf('d').toISOString();
      const gridColumn = document.querySelectorAll(`[datetime='${now}'].dr-agenda__grid-column`)[0];

      if (gridColumn) {
        const marker = document.createElement('div');
        gridColumn.appendChild(marker);
        marker.classList.add('dr-agenda__timemarker');
        this.updateTimeMarker(this.now);
        return true;
      }

      this.updateTimeMarker();
      return false;
    },

    updateTimeMarker(time) {
      const marker = document.querySelectorAll('.dr-agenda__timemarker')[0];

      if (marker) {
        const agendaStart = moment().startOf('d').minutes(this.config.start);
        const agendaEnd = moment().startOf('d').minutes(this.config.end);

        if (time.isSameOrAfter(agendaStart, 'm') && time.isSameOrBefore(agendaEnd, 'm')) {
          marker.style.top = `${this.getTopPosition(time)}%`;
        } else {
          marker.remove();
        }
      }
    },

    placeEvents() {
      this.destroyEvents();
      const height = document.querySelector('.dr-agenda__grid-cell').offsetHeight;

      this.events.forEach((event) => {
        if (this.shouldEventBePlaced(event.date)) {
          const day = moment(event.date).startOf('d').toISOString();
          const column = document.querySelector(`[datetime='${day}'].dr-agenda__grid-column`);
          const eventTag = document.createElement('div');
          const bleed = this.eventBleed(event.date, event.duration);
          const eventTagHeight = ((event.duration - bleed) * height) / this.config.interval;
          const titleTag = document.createElement('span');

          titleTag.classList.add('dr-agenda__event-title');
          titleTag.innerText = event.title;

          eventTag.classList.add('dr-agenda__event');
          eventTag.style.height = `${eventTagHeight}px`;
          eventTag.style.top = `${this.getTopPosition(event.date)}%`;
          eventTag.appendChild(titleTag);

          column.appendChild(eventTag);
        }
      });
    },

    getTopPosition(date) {
      const time = moment()
        .startOf('d')
        .hours(moment(date).hours())
        .minutes(moment(date).minutes());

      let minutesTillNow = moment.duration(time.diff(this.config.today)).asMinutes();
      minutesTillNow = parseInt(minutesTillNow, 10) - this.config.start;

      let scale = (this.config.end - this.config.start);
      scale += this.config.interval; // Last grid row

      return (minutesTillNow * 100) / scale;
    },

    shouldEventBePlaced(time) {
      const today = moment().startOf('d');
      const date = moment()
        .startOf('d')
        .hours(moment(time).hours())
        .minutes(moment(time).minutes());
      const minutes = moment.duration(date.diff(today)).asMinutes();
      const when = moment(time).startOf('d');
      const inAgendaView = document.querySelectorAll(`[datetime='${when.toISOString()}'].dr-agenda__grid-column`);

      return (inAgendaView.length > 0)
        && (this.config.start <= minutes && minutes <= this.config.end);
    },

    eventBleed(time, duration) {
      const start = moment(time);
      const end = moment(start).minutes(duration);
      const day = moment(start).startOf('d');
      const minutes = moment.duration(end.diff(day)).asMinutes();

      return (this.config.end >= minutes) ? 0 : (minutes - this.config.end - this.config.interval);
    },

    getWeekdays(daysView, selectedDate) {
      const week = selectedDate.week();
      const weekdayNames = moment.weekdays();
      const currentWeek = moment().week(week).startOf('w');
      const weekdays = [];
      const whichWeekdays = [];

      let day = 0;
      for (let i = 0; i < 14; i += 1) {
        day = day > 6 ? 0 : day;
        weekdays.push({
          date: moment({ ...currentWeek }).add(i, 'd'),
          weekdayName: weekdayNames[day],
          dayInWeek: day,
        });
        day += 1;
      }

      const selectedDateIndex = weekdays.findIndex(d => d.date.isSame(moment(selectedDate)));

      switch (true) {
        case (daysView === 1):
        case (daysView === 2):
        case (daysView === 3):
        case (daysView === 4):
          for (let i = 0; i < daysView; i += 1) {
            whichWeekdays.push(weekdays[selectedDateIndex + i]);
          }
          break;

        case (daysView === 5):
        case (daysView === 6):
        case (daysView === 7):
          for (
            let i = (daysView === 7) ? 0 : 1;
            i <= daysView;
            i += 1
          ) {
            if (daysView === 7 && i !== daysView) {
              whichWeekdays.push(weekdays[i]);
            }

            if (daysView < 7) {
              whichWeekdays.push(weekdays[i]);
            }
          }
          break;

        default:
      }

      return whichWeekdays.map((weekday) => {
        const className = [];
        const today = moment();
        const datetime = weekday.date.toISOString();

        if (weekday.date.isBefore(today, 'd')) {
          className.push('dr-agenda__weekday--past');
        }

        if (weekday.date.isSame(today, 'd')) {
          className.push('dr-agenda__weekday--today');
        }

        if (weekday.date.isSame(selectedDate, 'd')) {
          className.push('dr-agenda__weekday--selected');
        }

        return { ...weekday, className, datetime };
      });
    },

    destroyTimeMarker() {
      document.querySelectorAll('.dr-agenda__timemarker').forEach(marker => marker.remove());
    },

    destroyEvents() {
      document.querySelectorAll('.dr-agenda__event').forEach(event => event.remove());
    },
  },
};
</script>

<style lang="scss">
$border-color: rgba(0, 0, 0, 0.1);
$font-color: #2c3e50;
$marker-color: #e44c4c;
$event-color: $font-color;

.dr-agenda {
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  padding-bottom: 2rem;

  &__header {
    align-content: flex-end;
    align-self: flex-start;
    background-color: #fff;
    border-bottom: 1px solid $border-color;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    display: flex;
    justify-content: flex-end;
    position: sticky;
    top: 0;
    width: 100%;
    z-index: 1000;

    &-wrapper {
      align-items: center;
      align-self: flex-start;
      box-sizing: border-box;
      display: flex;
      flex-wrap: nowrap;
      justify-content: space-between;
      position: sticky;
      top: 0;
      width: 95%;
    }
  }

  &__weekday {
    $weekday: &;

    align-items: baseline;
    box-sizing: border-box;
    display: flex;
    flex: 0 0 calc(100% / 7);
    justify-content: center;
    padding: 0.5rem;
    position: relative;

    @for $i from 1 through 7 {
      &--#{$i} {
        flex: 0 0 calc(100% / #{$i});
      }
    }

    &:not(:last-of-type) {
      &:after {
        content: '';
        border-right: 1px solid $border-color;
        bottom: 0;
        height: 40%;
        position: absolute;
        right: 0;
        width: 0;
      }
    }

    &:first-of-type {
      &:before {
        content: '';
        border-right: 1px solid $border-color;
        bottom: 0;
        height: 40%;
        position: absolute;
        left: -1px;
        width: 0;
      }
    }

    &--past {
      #{$weekday}-date,
      #{$weekday}-name {
        filter: opacity(0.6);
      }
    }

    &--selected {
      #{$weekday}-date {
        background-color: $border-color;
        border-color: $border-color;
      }
    }

    &--today {
      #{$weekday}-name {
        color: mix(#000000, $font-color, 50%);
      }

      #{$weekday}-date {
        background-color: mix(#ffffff, $font-color, 10%);
        color: #ffffff;
        transition: all ease 0.2s;

        &:hover {
          background-color: mix(#ffffff, $font-color, 60%);
          color: mix(#000000, $font-color, 1%);
          transition: all ease 0.2s;
        }
      }
    }

    &-name {
      font-size: 1rem;
    }

    &-date {
      align-items: center;
      border: 1px solid transparent;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      font-size: 1.25rem;
      height: 2rem;
      justify-content: center;
      margin-left: 0.5rem;
      transition: all ease 0.2s;
      width: 2rem;

      &:hover {
        background-color: #f0f0f0;
        transition: all ease 0.2s;
      }
    }
  }

  &__body {
    align-content: center;
    box-sizing: border-box;
    display: flex;
    flex: 0 0 100%;
    justify-content: space-between;
    width: 100%;
  }

  &__periods {
    align-self: flex-start;
    border-right: 1px solid $border-color;
    box-sizing: border-box;
    width: 5%;

    &-time {
      box-sizing: border-box;
      height: 38px;
      position: relative;

      &:after {
        content: '';
        border-bottom: 1px solid $border-color;
        bottom: 0;
        height: 1px;
        position: absolute;
        right: 0;
        width: 20%;
      }

      span {
        align-content: center;
        box-sizing: border-box;
        bottom: calc((0.9rem / 2) * -1);
        display: flex;
        font-size: 0.8rem;
        height: 1rem;
        justify-content: center;
        padding: 0 0.3rem 0 0;
        position: absolute;
        width: 100%;
      }
    }
  }

  &__timetable {
    box-sizing: border-box;
    width: 95%;
  }

  &__grid {
    align-content: center;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    width: 100%;

    &-column {
      align-content: flex-start;
      box-sizing: border-box;
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      position: relative;

      @for $i from 1 through 7 {
        &--#{$i} {
          flex: 0 0 calc(100% / #{$i});
        }
      }
    }

    &-cell {
      border-bottom: 1px solid $border-color;
      border-right: 1px solid $border-color;
      box-sizing: border-box;
      cursor: cell;
      flex: 0 0 100%;
      height: 38px;
      padding: 0.5rem;
      z-index: 200;

      &--selected {
        background-color: mix(#ffffff, $font-color, 95%);
        border: 2px solid mix(#ffffff, $font-color, 35%);
        box-shadow: 0 0 5px mix(#ffffff, $font-color, 75%);
        z-index: 300;
      }
    }
  }

  &__timemarker {
    background-color: $marker-color;
    box-sizing: border-box;
    height: 2px;
    position: absolute;
    transition: all ease 0.2s;
    width: 100%;
    z-index: 800;

    &:before {
      $marker-size: 0.6rem;

      background-color: $marker-color;
      border-radius: 50%;
      content: '';
      display: block;
      height: $marker-size;
      left: calc(((#{$marker-size} / 2) * -1) - 1px);
      position: absolute;
      top: calc(((#{$marker-size} / 2) * -1) + 1px);
      width: $marker-size;
    }
  }

  &__event {
    $bg-color: rgba(lighten($font-color, 70%), 0.8);

    background-color: $bg-color;
    box-sizing: border-box;
    position: absolute;
    width: 100%;
    z-index: 500;

    &:before {
      background-color: $font-color;
      content: '';
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 5px;
    }

    &-title {
      box-sizing: border-box;
      display: block;
      font-size: 0.85rem;
      overflow: hidden;
      padding-left: 10px;
      padding-top: 2px;
      text-overflow: clip;
      white-space: nowrap;
    }
  }
}
</style>
