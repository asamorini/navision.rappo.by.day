# navision.rappo
Once activated, reports will appear at each screen
(the first time you access the Navision page, then it remains active until the session expires)
- total the hours per day
- an additional column is displayed with the "Notes" field of the report

![plugin_enabled](docs/images/navision.rappo.jpg)

# <a name="installation">:wrench: Installation "Rappo by day"</a>
1) [ONLY ONCE] Add a :bookmark: Bookmark "NAVISION: rapportini-ferie plugin" to your browser (with a name as you want)
   - copy and paste this javascript code into the bookmark URL
      ```
      javascript:jQuery.ajaxSetup(%7Bcache:true%7D);jQuery.getScript('https://asamorini.github.io/navision.rappo/src/js/navision.tot.by.day.js');
      ```
   - EDGE EXCEPTION: 
      use this code instead
      ```
      javascript:jQuery.getScript('https://asamorini.github.io/navision.rappo/src/js/navision.tot.by.day.js');
      ```
2) When you are visiting https://navisionweb........it/ site, after logging in, you can activate the plugin by running the bookmark
