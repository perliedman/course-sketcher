export default {
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
      mapFileRequest: 'Den här Purple Pen-filen använder en kartfil med namnet <strong><em>{fileName}</em></strong>, dra och släpp den här.',
      mapLoadError: '😞 Något gick fel när vi läste filen: <em>{error}</em>',
      unknownFileType: '🤔 Hm, den sortens fil känner jag inte igen. Försök med OCAD- eller Purple Pen-filer.',
      ensureCorrectMap: 'Purple Pen-filen är gjord för en karta som heter <strong><em>{fileName}</em></strong>, är du säker att du använder rätt kartfil? 🤔'
    },
    menus: {
      courses: 'Banor',
      map: 'Karta',
      print: 'Utskrift'
    },
    actions: {
      removeMap: 'Ta bort',
      ok: 'Ok',
      cancel: 'Avbryt',
      search: 'Sök',
      remove: 'Ta bort',
      print: 'Skriv ut',
      printing: 'Skriver ut...',
      makeFinish: 'Gör till målpunkt'
    },
    event: {
      newName: 'Ny träning'
    },
    course: {
      newName: 'Ny bana'
    },
    control: {
      selectDescription: 'Välj kontrollbeskrivning'
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
      ensureCorrectMap: 'The Purple Pen file uses a map called <strong><em>{fileName}</em></strong>, are you sure this is the correct map? 🤔'
    },
    menus: {
      courses: 'Courses',
      map: 'Map',
      print: 'Print'
    },
    actions: {
      removeMap: 'Remove',
      ok: 'Ok',
      cancel: 'Cancel',
      search: 'Search',
      remove: 'Remove',
      print: 'Print',
      printing: 'Printing...',
      makeFinish: 'Finish'
    },
    event: {
      newName: 'New training'
    },
    course: {
      newName: 'New course'
    },
    control: {
      selectDescription: 'Choose Control Description'
    }
  }
}

export const languages = [
  {code: 'en', flag: 'gb', title: 'English'},
  {code: 'sv', flag: 'se', title: 'Svenska'}
]
