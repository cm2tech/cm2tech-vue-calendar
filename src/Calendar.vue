<template>
  <article class="dr-calendar">
    <header class="dr-calendar__header">
      <h1 class="dr-calendar__title">
        {{ month }} de {{ year }}
      </h1>

      <div class="dr-calendar__controls">
        <button
          aria-label="Mês anterior"
          class="dr-calendar__controls--prev"
          @click="addMonth(-1)"
        >
          <i class="dr-calendar__controls--prev-icon" />
        </button>

        <button
          aria-label="Próximo mês"
          class="dr-calendar__controls--next"
          @click="addMonth(1)"
        >
          <i class="dr-calendar__controls--next-icon" />
        </button>
      </div>
    </header>

    <section class="dr-calendar__body">
      <header class="dr-calendar__weekdays">
        <div
          v-for="(name, i) in weekdayNames"
          :key="`weekday_${i}`"
          class="dr-calendar__weekdays--name"
        >
          {{ name | toFirstLetter }}
        </div>
      </header>

      <section class="dr-calendar__monthdays">
        <div
          v-for="day in [...days.prev, ...days.days, ...days.next]"
          :key="`${day.year}${day.month}.${day.day}`"
          :class="day.class"
          class="dr-calendar__day"
          @click.prevent="selectDay(day, $event)"
        >
          {{ day.day }}
        </div>
      </section>
    </section>
  </article>
</template>

<script>
export default {
  name: 'DrCalendar',

  filters: {
    toFirstLetter(value) {
      return value.charAt(0);
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

    fn: {
      type: Function,
      required: false,
      default: () => {},
    },
  },

  data() {
    return {
      today: this.$moment(),
      currentDate: Object,
      weekdayNames: this.$moment.weekdays(),
    };
  },

  computed: {
    year() {
      return this.$moment(this.currentDate).format('YYYY');
    },

    month() {
      return this.$moment(this.currentDate).format('MMMM');
    },

    days() {
      // Current month's days
      const days = [];

      for (
        let i = 1;
        i <= this.$moment(this.currentDate).daysInMonth();
        i += 1
      ) {
        const className = (this.$moment(this.currentDate).date() === i + 1)
          ? 'dr-calendar__day--selected'
          : '';

        days.push(this.createDay(this.currentDate, i, className));
      }

      // Previous month's days
      const prevDays = [];
      const prevMonth = this.$moment(this.currentDate).add(-1, 'M');
      const firstWeekday = this.$moment().set({
        year: this.$moment(this.currentDate).year(),
        month: this.$moment(this.currentDate).month(),
        date: 1,
      }).day();

      for (
        let i = prevMonth.daysInMonth();
        i >= (prevMonth.daysInMonth() - (firstWeekday - 1));
        i -= 1
      ) {
        prevDays.unshift(this.createDay(this.currentDate, i, 'prev'));
      }

      // Next month's days
      const nextDays = [];
      const limit = prevDays.length + parseInt(this.$moment(this.currentDate).daysInMonth(), 10);

      for (
        let i = 1;
        i <= ((7 * 6) - limit);
        i += 1
      ) {
        nextDays.push(this.createDay(this.currentDate, i, 'next'));
      }

      return { prev: prevDays, days, next: nextDays };
    },
  },

  beforeMount() {
    this.currentDate = { ...this.$moment(this.selectedDate) };
  },

  methods: {
    selectDay(day, event) {
      this.currentDate = { ...this.$moment(day) };
      this.fn(this.$moment(this.currentDate).startOf('d').toISOString(), event);
    },

    addMonth(m) {
      this.currentDate = { ...this.$moment(this.currentDate).add(m, 'M') };
    },

    createDay(date, day, pos) {
      let amount = 0;
      if (pos === 'next') amount = 1;
      if (pos === 'prev') amount = -1;

      const newDate = this.$moment(date).add(amount, 'M');
      const moment = this.$moment().set({
        year: this.$moment(newDate).year(),
        month: this.$moment(newDate).month(),
        date: day,
      });

      const className = [];
      if (this.$moment(this.$moment(this.today)).isSame(moment, 'day')) {
        className.push('dr-calendar__day--today');
      }
      if (this.$moment(this.$moment(this.currentDate)).isSame(moment, 'day')) {
        className.push('dr-calendar__day--selected');
      }

      if (pos === 'next') className.push('dr-calendar__day--next');
      if (pos === 'prev') className.push('dr-calendar__day--prev');

      return {
        ...moment,
        year: this.$moment(moment).year(),
        month: this.$moment(moment).month(),
        day: this.$moment(moment).date(),
        class: className,
      };
    },
  },
};
</script>

<style lang="scss">
$color: #2c3e50;

.dr-calendar {
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  font-feature-settings: "tnum" 1;
  margin: 1rem;
  width: max-content;

  &__header {
    align-items: center;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    padding: 0.7rem 1.5rem;
  }

  &__title {
    box-sizing: border-box;
    cursor: default;
    display: block;
    font-size: 1rem;
    margin: 0;
    padding: 0;
  }

  &__controls {
    align-items: center;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 3.2rem;

    &--next,
    &--prev {
      align-items: center;
      background-color: transparent;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
      display: center;
      height: 1.5rem;
      justify-content: center;
      margin: 0;
      padding: 0;
      transition: all ease 0.2s;
      width: 1.5rem;

      &:hover {
        background-color: #f5f5f5;
        transition: all ease 0.2s;
      }

      &-icon {
        display: block;
        height: 100%;
        width: 100%;
        position: relative;

        &:after,
        &:before {
          background-color: $color;
          content: '';
          display: block;
          height: 1px;
          position: absolute;
          top: 50%;
          width: 0.5rem;
        }
      }
    }

    &--next {
      &-icon {
        &:after,
        &:before {
          left: 35%;
        }

        &:after {
          transform: rotate(40deg);
          transform-origin: bottom right;
        }

        &:before {
          transform: rotate(-40deg);
          transform-origin: top right;
        }
      }
    }

    &--prev {
      &-icon {
        &:after,
        &:before {
          right: 30%;
        }

        &:after {
          transform: rotate(-40deg);
          transform-origin: bottom left;
        }

        &:before {
          transform: rotate(40deg);
          transform-origin: top left;
        }
      }
    }
  }

  &__body {
    box-sizing: border-box;
    padding: 0.5rem;
  }

  &__weekdays {
    align-items: center;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
    max-width: 300px;

    &--name {
      cursor: default;
      flex: 0 0 calc(100% / 7);
      font-weight: bolder;
      text-align: center;
    }
  }

  &__monthdays {
    align-items: center;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    max-width: 300px;
  }

  &__day {
    align-items: center;
    border-radius: 2px;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex: 0 0 calc(100% / 7);
    height: 2rem;
    justify-content: center;
    margin: 0;
    padding: 0;
    text-align: center;
    width: 2rem;

    &--selected {
      background-color: #f1f1f1;
    }

    &--today {
      background-color: mix(gray, #f2f2f2, 20%);
    }

    &--next,
    &--prev {
      filter: grayscale(100%) opacity(25%);
    }
  }
}

</style>
