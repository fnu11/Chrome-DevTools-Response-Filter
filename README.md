# Chrome-DevTools-Response-Filter
[Chrome Extension] Filter HTTP GET/POST and Requests/Response.

The extension allows you to sort response. Open it in dev mode as an unpacked extension.
 
![scr](https://github.com/fnu11/Chrome-DevTools-Response-Filter/blob/main/images/scr1.png?raw=true)

The new tab will allow you to filter content by your keywords list. Filter by basic parameters. Modify requests with resubmission.

![scr](https://github.com/fnu11/Chrome-DevTools-Response-Filter/blob/main/images/scr_1.png?raw=true)

If you want to filter by response, then click the "Filter response" button. Write each line you are looking for on a new line. If one of the strings matches the contents of the file, it will be displayed in the list. Attention. If written headers and body then both conditions of one of the lines must be met. This entry is saved with the save button.

![scr](https://github.com/fnu11/Chrome-DevTools-Response-Filter/blob/main/images/scr_2.png?raw=true)

Now you can step through the sites and immediately see the content you are looking for. You can set up a field selection first, and then set up a content selection.
 
This is so lacking Dev Tools. I had to make a working version based on existing solutions.
