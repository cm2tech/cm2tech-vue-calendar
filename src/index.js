import drAgenda from './Agenda.vue';
import drCalendar from './Calendar.vue';

function install(Vue) {
  if (install.installed) return;
  install.installed = true;
  Vue.component('dr-agenda', drAgenda);
  Vue.component('dr-calendar', drCalendar);
}

const plugin = {
  install,
};

let GlobalVue = null;
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue;
} else if (typeof global !== 'undefined') {
  GlobalVue = global.vue;
}
if (GlobalVue) {
  GlobalVue.use(plugin);
}

drAgenda.install = install;
drCalendar.install = install;

export default { drAgenda, drCalendar };
