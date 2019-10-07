import Vue from 'vue'
import VueI18n from 'vue-i18n'
import storage from './storage'

const messages = {
  sv: {
    hero: {
      title: 'Course<br/>Sketcher',
      subtitle: 'Web based course setting for orienteering',
      info: `
        <img class="hard-hat" src="hard-hat.png" width="15%"/>
        <p>
          Den här programvaran är inte färdigutvecklad ännu. Pröva gärna, men på egen risk.
          Rapportera gärna synpunkter, buggar, önskemål och så vidare på <a href="https://github.com/perliedman/purple-web">GitHub</a>.
        </p>`
    },
    messages: {
      emptyMap: 'Dra en OCAD-kartfil eller Purple Pen-fil hit, eller klicka för att välja en fil',
      loadingMap: 'Läser och bearbetar kartan, det här kan ta en liten stund...',
      mapFileRequest: 'De här banorna använder en kartfil med namnet <strong><em>{fileName}</em></strong>, dra och släpp den här.',
      mapLoadError: '😞 Något gick fel när vi läste filen: <em>{error}</em>',
      unknownFileType: '🤔 Hm, den sortens fil känner jag inte igen. Försök med OCAD- eller Purple Pen-filer.',
      ensureCorrectMap: 'Purple Pen-filen är gjord för en karta som heter <strong><em>{fileName}</em></strong>, är du säker att du använder rätt kartfil? 🤔',
      restoreAvailable: 'Det finns sparad data från tidigare, vill du återställa den?'
    },
    menus: {
      courses: 'Banor',
      map: 'Karta',
      print: 'Utskrift'
    },
    actions: {
      selectMap: 'Välj karta',
      removeMap: 'Ta bort',
      ok: 'Ok',
      yes: 'Ja',
      no: 'Nej',
      cancel: 'Avbryt',
      close: 'Stäng',
      search: 'Sök',
      removeFromCourse: 'Ta bort från banan',
      deleteControl: 'Ta bort kontrollen',
      print: 'Skriv ut',
      printing: 'Skriver ut...',
      makeFinish: 'Gör till målpunkt',
      newCourse: 'Lägg till bana',
      open: 'Öppna',
      save: 'Spara',
    },
    event: {
      newName: 'Ny träning'
    },
    course: {
      newName: 'Ny bana',
      printScale: 'Utskriftsskala'
    },
    control: {
      selectDescription: 'Välj kontrollbeskrivning'
    },
    map: {
      mapMissing: 'Ingen karta är vald'
    }
  },
  en: {
    hero: {
      title: 'Course<br/>Sketcher',
      subtitle: 'Web based course setting for orienteering',
      info: `
        <img class="hard-hat" src="hard-hat.png" width="15%"/>
        <p>
          This software is still under development. Feel free to try it out, but at your own risk.
          Please report suggestions, bugs, feature requests and so on at the <a href="https://github.com/perliedman/purple-web">GitHub page</a>.
        </p>`
    },
    messages: {
      emptyMap: 'Drop an OCAD map file or Purple Pen file here, or click to select a file',
      loadingMap: 'Reading and preparing map, this can take a few moments...',
      mapFileRequest: 'This event uses a map file named <strong><em>{fileName}</em></strong>, please drag it here.',
      mapLoadError: '😞 Something went wrong when reading that file: <em>{error}</em>',
      unknownFileType: '🤔 Uhm, I don\'t recognize that type of file. Try with OCAD or Purple Pen files.',
      ensureCorrectMap: 'The courses use a map called <strong><em>{fileName}</em></strong>, are you sure this is the correct map? 🤔',
      restoreAvailable: 'Saved data from an earlier session is available, do you want to restore?',
    },
    menus: {
      courses: 'Courses',
      map: 'Map',
      print: 'Print'
    },
    actions: {
      selectMap: 'Select Map',
      removeMap: 'Remove',
      ok: 'Ok',
      yes: 'Yes',
      no: 'No',
      close: 'Close',
      cancel: 'Cancel',
      search: 'Search',
      removeFromCourse: 'Remove from course',
      deleteControl: 'Delete control',
      print: 'Print',
      printing: 'Printing...',
      makeFinish: 'Finish',
      newCourse: 'Add Course',
      open: 'Open',
      save: 'Save',
    },
    event: {
      newName: 'New training'
    },
    course: {
      newName: 'New course',
      printScale: 'Print Scale'
    },
    control: {
      selectDescription: 'Choose Control Description'
    },
    map: {
      mapMissing: 'No map loaded'
    }
  }
}

export const languages = [
  {code: 'en', flag: 'gb', title: 'English'},
  {code: 'sv', flag: 'se', title: 'Svenska'}
]

const defaultLocale = storage.get('ui.lang') ||
  navigator.languages.find(l => languages.findIndex(langDef => langDef.code === l) >= 0)

Vue.use(VueI18n)
export default new VueI18n({
  locale: defaultLocale || 'en',
  fallbackLocale: 'en',
  messages
})
