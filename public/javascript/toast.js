/*const toastLive = document.getElementById('liveToast');
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLive);

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ buttons.js loaded');

  document.addEventListener('click', function (e) {
        // Check if the clicked element is a button
        const button = e.target.closest('button');
        console.log(button);
        

        if (button) {
          const value = button.value || '[no value]'
          console.log('  Value:', value);

          if(value === 'toasty'){
                toastBootstrap.show(); 
          }
        }
  });
});
*/

const toastTrigger = document.getElementById('subscribeButtonFooterId');
const toastLive = document.getElementById('liveToast');
const inputNewsletter  = document.getElementById('newsletterInput'); 
const displayedMessage = document.getElementById('toastMessage'); 
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLive);

if (toastTrigger) { 
  
  /*
  if(inputNewsletter.trim !== ""){
    displayedMessage.textContent = "Thanks for subscribing!"; 
    console.log("thanks for subscribing message --- True");
  } 
  else
  {
    displayedMessage.textContent = "Invalid email address!"; 
        console.log("Error --- False");
  }*/

  toastTrigger.addEventListener('click', () => {
    toastBootstrap.show();
  });
}
