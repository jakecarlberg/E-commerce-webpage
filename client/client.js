host = window.location.protocol + '//' + location.host

function viewHome() {
   setTimeout(updateNavbar, 400);
   displayAllBikes();
}
var currentCategoryValue;

// wait for synchronising the login
function updateNavbar() {
   var signedIn = false;
   var authInfo = sessionStorage.getItem('auth');
   var isAdmin = false;
   if ( authInfo !== null ) {
      signedIn = true;
      var currentUser = JSON.parse(sessionStorage.getItem('auth')).user;
      isAdmin = currentUser.is_admin;
   }
   $('#sign_up, #log_in, #signup_icon, #login_icon').toggleClass('d-none', signedIn);
   $('#applications, #application_icon, #messages, #messages_icon, #orders, #orders_icon, #admin_icon, #admin').toggleClass('d-none', !isAdmin);
   $('#my_profile, #profile_icon, #log_out').toggleClass('d-none', !signedIn);
}

// Function to view applications
function viewApplications() {
   $(".container").html($("#view-applications").html())
   $(".container0").hide();
   $("#applications-list").empty();
   $.ajax({
      url: host + '/bikes',
      type: 'GET',
      success: function(bikes) {
         bikes.forEach(function (bike) {
            if (!bike.is_listed && !bike.is_sold) {
               var bikeView = $(`     
               <div class="card mb-3" id="card3"> 
                  <img src="${bike.picture_path}" id="allBikes-pic">             
                  <div class="card-body">
                     <h5 class="card-title merriweather-regular">${bike.model} </h5>
                     <p class="card-text merriweather-regular">User ID: ${bike.seller_id}</p>
                     <p class="card-text merriweather-regular">Category: ${bike.category}</p>
                     <p class="card-text merriweather-regular">Price: ${bike.price} SEK</p>
                     <p class="card-text merriweather-regular">Condition: ${bike.condition}</p>
                     <p class="card-text merriweather-regular">Age: ${bike.age} years</p>
                     <p class="card-text merriweather-regular">Gears: ${bike.gears}</p>
                     <button class="btn allbuttons" id="approve-button" onclick="listBike(${bike.id})" data-id="${bike.id}">Approve</button>
                  </div>
               </div>`);
               $("#applications-list").append(bikeView);
            }
         });
      },
      error: function() {
         console("Error fetching bikes.");
      }
   });
 }

// Function to view orders as admin
function viewOrders() {
   $(".container").html($("#view-orders").html())
   $(".container0").hide();
   $("#orders-list").empty(); 
   seller_email = 'no email';
   $.ajax({
      url: host + '/bikes',
      type: 'GET',
      success: function(bikes) {
         bikes.forEach(function (bike) {
            if (bike.is_sold) {                      
            $.ajax({
               url: host + '/users/' + bike.seller_id,
               type: 'GET',
               contentType: 'application/json', 
               headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
               success: function(seller){
                  seller_email = seller.email;
               },
               error: function(){
                  console.log("error getting order");
               }
            });
            setTimeout(function() {
            var orderView = $(`      
               <div class="card mb-3" id="card5">       
                  <img src="${bike.picture_path}" id="allBikes-pic">      
                  <div class="card-body">
                     <h5 class="card-title merriweather-regular">Bike: (${bike.id}) ${bike.model} </h5>
                     <p class="card-text merriweather-regular">Category: ${bike.category} </p> 
                     <p class="card-text merriweather-regular">Payment to seller: ${bike.price - 50} SEK</p>   
                     <p class="card-text merriweather-regular">Fee: 50 SEK </p>   
                     <p class="card-text merriweather-regular">Seller: ${seller_email} </p>
                  </div>
               </div>`);
            $("#orders-list").append(orderView);
            }, 400);
            }
         });
      },
      error: function() {
         console("Error fetching bikes."); 
      }
   });
}

// Function to list bike
function listBike(bike_id) {
   var currentUser = JSON.parse(sessionStorage.getItem('auth')).user;
   var user_id = currentUser.id;
   $.ajax({
      url: host + '/bikes/' + bike_id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ 
         is_listed: true,
         user_id: user_id
         }),
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function() {
         console.log("Success listing bike.");
      },
      error: function() {
         console.log("Error listing bike.");
      } 
   }); 
   setTimeout(() => {
      viewApplications();
   }, 1000);
}

// Function to open messages script by admin
function viewMessages() {
   $(".container").html($("#view-messages").html());
   $(".container0").hide();
   $("#messages-list").empty();
   $.ajax({
      url: host + '/messages',
      type: 'GET',
      success: function(messages) {
         messages.sort((a, b) => b.id - a.id);
         messages.forEach(function (message) {
            var messageView = $(`      
               <div class="card mb-3">               
                  <div class="card-body">
                     <h5 class="card-title merriweather-regular">Name: ${message.name}</h5> 
                     <h5 class="card-title merriweather-regular">E-mail: ${message.email} </h5> 
                     <p class="card-text merriweather-regular">Message: ${message.message} </p>
                  </div>
               </div>`);
            $("#messages-list").append(messageView);
         });
      },
      error: function() {
         alert("Error fetching messages."); 
      }
   });
}

// function to open contacts script
function viewContact() {
   $(".container").html($("#view-contact").html());
   $(".container0").hide();
}

// function to send message
function sendMessageButton() {
   var name = $("#inputName").val();
   var email = $("#inputEmail").val();
   var message = $("#inputMessage").val();

   $.ajax({
      url: host + '/messages',
      type: 'POST',
      contentType: 'application/json', 
      data: JSON.stringify({
         name: name, 
         email: email, 
         message: message
      }), 
      success: function() {
         console.log("ajax success");
      },
      error: function(error) {
         console.error("Error submitting message:", error);
      }
   });
   alert("You have sucessfully sent an email to reCycle!");
   viewHome()
}

// function to open about us script
function viewAbout() {
   $(".container").html($("#view-about").html());
   $(".container0").hide();
}

// Function to sort the bikes in displayAllBikes()
function sortBikes(sortByValue, bikes)  {
   if (sortByValue == 0) {
      bikes.sort(function(a, b) {
         return b.id - a.id;
     });
   } else if (sortByValue == 1) {
      bikes.sort(function(a, b) {
         return a.price - b.price;
     });
   } else if (sortByValue == 2) {
      bikes.sort(function(a, b) {
         return a.age - b.age;
     });
   } else if (sortByValue == 3) {
      bikes.sort(function(a, b) {
         return b.condition - a.condition;
     });
   }
   return bikes;
 }

 // Function to store filter options
 function setStoredOption(){
   var storedOption = localStorage.getItem("sortOption");
   if (storedOption !== "undefined"){
      $('#selectSort').val(storedOption);
   }
   if (localStorage.getItem('lowPriceChecked') === 'true') {
      $('#lowPrice').prop('checked', true);
   }
   if (localStorage.getItem('middlePriceChecked') === 'true') {
      $('#middlePrice').prop('checked', true);
   }
   if (localStorage.getItem('highPriceChecked') === 'true') {
      $('#highPrice').prop('checked', true);
   }
   if (localStorage.getItem('lowGearsChecked') === 'true') {
      $('#lowGears').prop('checked', true);
   }
   if (localStorage.getItem('highGearsChecked') === 'true') {
      $('#highGears').prop('checked', true);
   }
   if (localStorage.getItem('newChecked') === 'true') {
      $('#new').prop('checked', true);
   }
   if (localStorage.getItem('lowAgeChecked') === 'true') {
      $('#lowAge').prop('checked', true);
   }
   if (localStorage.getItem('highAgeChecked') === 'true') {
      $('#highAge').prop('checked', true);
   }
   if (localStorage.getItem('lowConditionChecked') === 'true') {
      $('#lowCondition').prop('checked', true);
   }
   if (localStorage.getItem('highConditionChecked') === 'true') {
      $('#highCondition').prop('checked', true);
   }
 }
 
 // Function to filter displayAllBikes() using checkbox
 function checkBox() {
   $('#lowPrice, #middlePrice, #highPrice').on('change', function(){
      if ($('#lowPrice').prop('checked') && $('#highPrice').prop('checked')){
         $('#middlePrice').prop('checked', true);
      } else {
         $('#middlePrice').prop('disabled', false);
      }
   });
   $('#new, #lowAge, #highAge').on('change', function(){
      if ($('#new').prop('checked') && $('#highAge').prop('checked')){
         $('#lowAge').prop('checked', true);
      } else {
         $('#lowAge').prop('disabled', false);
      }
   });
 } 

// Function to fetch and display bikes in View bikes script
function displayAllBikes() {
   var lowestPrice = 0;
   var highestPrice = 100000000000;
   var lowestGears = 0;
   var highestGears = 100000000000;
   var lowestAge = 0;
   var highestAge = 10000000000;
   var lowestCondition = 1;
   var highestCondition = 5;
   if ($('#lowPrice').prop('checked')) {
      highestPrice = 999;
   } if ($('#middlePrice').prop('checked')  ) {
      lowestPrice = 1000;
      highestPrice = 5000;
   } if ($('#highPrice').prop('checked')) {
      lowestPrice = 5001;
   } if ($('#lowPrice').prop('checked') && $('#middlePrice').prop('checked')) {
      lowestPrice = 0;
      highestPrice = 5000;
   } if ($('#middlePrice').prop('checked') && $('#highPrice').prop('checked')) {
      lowestPrice = 1000;
      highestPrice = 1000000000;
   } 
   if ($('#lowGears').prop('checked')) {
      highestGears = 4;
   } if ($('#highGears').prop('checked')) {
      lowestGears = 5;
   }
   if ($('#lowGears').prop('checked') && $('#highGears').prop('checked')) {
      lowestGears = 0;
      highestGears = 100000000;
   }
   if ($('#new').prop('checked')) {
      highestAge = 1;
   } if ($('#lowAge').prop('checked')) {
      lowestAge = 2;
      highestAge = 5;
   } if ($('#highAge').prop('checked')) {
      lowestAge = 6;
      highestAge = 1000000;
   }  if ($('#new').prop('checked') && $('#lowAge').prop('checked')) {
      lowestAge = 0;
      highestAge = 5;
   }  if ($('#lowAge').prop('checked') && $('#highAge').prop('checked')) {
      lowestAge = 2;
      highestAge = 1000000;
   } 
   if ($('#lowCondition').prop('checked')) {
      highestCondition = 2;
   } if ($('#highCondition').prop('checked')) {
      lowestCondition = 3;
   }
   if ($('#lowCondition').prop('checked') && $('#highCondition').prop('checked')) {
      lowestCondition = 1;
      highestCondition = 5;
   }
   
   var sortByValue = $('#selectSort').val();
 
   localStorage.setItem("sortOption", sortByValue);
   localStorage.setItem('lowPriceChecked', $('#lowPrice').prop('checked'));
   localStorage.setItem('middlePriceChecked', $('#middlePrice').prop('checked'));
   localStorage.setItem('highPriceChecked', $('#highPrice').prop('checked'));
   localStorage.setItem('lowGearsChecked', $('#lowGears').prop('checked'));
   localStorage.setItem('highGearsChecked', $('#highGears').prop('checked'));
   localStorage.setItem('newChecked', $('#new').prop('checked'));
   localStorage.setItem('lowAgeChecked', $('#lowAge').prop('checked'));
   localStorage.setItem('highAgeChecked', $('#highAge').prop('checked'));
   localStorage.setItem('lowConditionChecked', $('#lowCondition').prop('checked'));
   localStorage.setItem('highConditionChecked', $('#highCondition').prop('checked'));
   setTimeout(() => {
      setStoredOption();
   }, 1);
   $(".container").html($("#view-home").html());
   $(".container0").html($("#view-home2").html());
   $(".container0").show();

   $("#home-list").empty(); 
   $.ajax({
      url: host + '/bikes',
      type: 'GET',
      success: function(bikes) {
         bikes = sortBikes(sortByValue, bikes);
         bikes.forEach(function (bike) {
            if (bike.is_listed) {
               if (bike.price >= lowestPrice && bike.price <= highestPrice) {
                  if (bike.gears >= lowestGears && bike.gears <= highestGears) {
                     if (bike.age >= lowestAge && bike.age <= highestAge) {
                        if (bike.condition >= lowestCondition && bike.condition <= highestCondition) {
                           var bikeView = `      
                              <a href="#" onclick="showBike(${bike.id}); return false;">
                              <div class="card mb-3" id ="card">
                              <img src="${bike.picture_path}" id="allBikes-pic">
                                 <div class="card-body allBikes">
                                    <div>
                                       
                                       <h5 class="card-text bike-title merriweather-regular">${bike.model} </h5> 
                                       <p class="card-text bike-title merriweather-regular">Category: ${bike.category} </p> 
                                       <p class="card-text merriweather-regular">${bike.price} SEK </p>
                                    </div>

                                 </div>
                              </div>
                           </a>`;
                           $("#home-list").append(bikeView);
                        }
                     }
                  }
               }
            }
         });
         currentCategoryValue = "";
      },
      error: function() {
         console("Error fetching bikes."); 
      }
   });
 }
 function displayAllBikes2() {
   var lowestPrice = 0;
   var highestPrice = 100000000000;
   var lowestGears = 0;
   var highestGears = 100000000000;
   var lowestAge = 0;
   var highestAge = 10000000000;
   var lowestCondition = 1;
   var highestCondition = 5;
   if ($('#lowPrice').prop('checked')) {
      highestPrice = 999;
   } if ($('#middlePrice').prop('checked')  ) {
      lowestPrice = 1000;
      highestPrice = 5000;
   } if ($('#highPrice').prop('checked')) {
      lowestPrice = 5001;
   } if ($('#lowPrice').prop('checked') && $('#middlePrice').prop('checked')) {
      lowestPrice = 0;
      highestPrice = 5000;
   } if ($('#middlePrice').prop('checked') && $('#highPrice').prop('checked')) {
      lowestPrice = 1000;
      highestPrice = 1000000000;
   } 
   if ($('#lowGears').prop('checked')) {
      highestGears = 4;
   } if ($('#highGears').prop('checked')) {
      lowestGears = 5;
   }
   if ($('#lowGears').prop('checked') && $('#highGears').prop('checked')) {
      lowestGears = 0;
      highestGears = 100000000;
   }
   if ($('#new').prop('checked')) {
      highestAge = 1;
   } if ($('#lowAge').prop('checked')) {
      lowestAge = 2;
      highestAge = 5;
   } if ($('#highAge').prop('checked')) {
      lowestAge = 6;
      highestAge = 1000000;
   }  if ($('#new').prop('checked') && $('#lowAge').prop('checked')) {
      lowestAge = 0;
      highestAge = 5;
   }  if ($('#lowAge').prop('checked') && $('#highAge').prop('checked')) {
      lowestAge = 2;
      highestAge = 1000000;
   } 
   if ($('#lowCondition').prop('checked')) {
      highestCondition = 2;
   } if ($('#highCondition').prop('checked')) {
      lowestCondition = 3;
   }
   if ($('#lowCondition').prop('checked') && $('#highCondition').prop('checked')) {
      lowestCondition = 1;
      highestCondition = 5;
   }
   
   var sortByValue = $('#selectSort').val();
 
   localStorage.setItem("sortOption", sortByValue);
   localStorage.setItem('lowPriceChecked', $('#lowPrice').prop('checked'));
   localStorage.setItem('middlePriceChecked', $('#middlePrice').prop('checked'));
   localStorage.setItem('highPriceChecked', $('#highPrice').prop('checked'));
   localStorage.setItem('lowGearsChecked', $('#lowGears').prop('checked'));
   localStorage.setItem('highGearsChecked', $('#highGears').prop('checked'));
   localStorage.setItem('newChecked', $('#new').prop('checked'));
   localStorage.setItem('lowAgeChecked', $('#lowAge').prop('checked'));
   localStorage.setItem('highAgeChecked', $('#highAge').prop('checked'));
   localStorage.setItem('lowConditionChecked', $('#lowCondition').prop('checked'));
   localStorage.setItem('highConditionChecked', $('#highCondition').prop('checked'));
   setTimeout(() => {
      setStoredOption();
   }, 1);
   $(".container").html($("#view-home").html());
   viewManyBikes();

   $("#home-list").empty(); 
   $.ajax({
      url: host + '/bikes',
      type: 'GET',
      success: function(bikes) {
         bikes = sortBikes(sortByValue, bikes);
         bikes.forEach(function (bike) {
            if (bike.is_listed) {
               if (bike.price >= lowestPrice && bike.price <= highestPrice) {
                  if (bike.gears >= lowestGears && bike.gears <= highestGears) {
                     if (bike.age >= lowestAge && bike.age <= highestAge) {
                        if (bike.condition >= lowestCondition && bike.condition <= highestCondition) {
                           var bikeView = `      
                              <a href="#" onclick="showBike(${bike.id}); return false;">
                              <div class="card mb-3" id ="card">
                              <img src="${bike.picture_path}" id="allBikes-pic">
                                 <div class="card-body allBikes">
                                    <div>
                                       
                                       <h5 class="card-text bike-title merriweather-regular">${bike.model} </h5> 
                                       <p class="card-text bike-title merriweather-regular">Category: ${bike.category} </p> 
                                       <p class="card-text merriweather-regular">${bike.price} SEK </p>
                                    </div>

                                 </div>
                              </div>
                           </a>`;
                           $("#home-list").append(bikeView);
                        }
                     }
                  }
               }
            }
         });
         currentCategoryValue = "";
      },
      error: function() {
         console("Error fetching bikes."); 
      }
   });
 }
 function viewBMX() {
   $(".container0").html($("#view-bmx").html());
   $(".container0").show();
 } 
 function viewMountainBike() {
   $(".container0").html($("#view-mountainbike").html());
   $(".container0").show();
 }
 function viewKid() {
   $(".container0").html($("#view-kid").html());
   $(".container0").show();
 } 
 function viewEl() {
   $(".container0").html($("#view-el").html());
   $(".container0").show();
 } 
 function viewAlternative() {
   $(".container0").html($("#view-alternative").html());
   $(".container0").show();
 } 
 function viewManyBikes() {
   $(".container0").html($("#view-manyBikes").html());
   $(".container0").show();
 } 
 
 function displayBikeCategory(bike_category) {
   var lowestPrice = 0;
   var highestPrice = 100000000000;
   var lowestGears = 0;
   var highestGears = 100000000000;
   var lowestAge = 0;
   var highestAge = 10000000000;
   var lowestCondition = 1;
   var highestCondition = 5;
   if ($('#lowPrice').prop('checked')) {
      highestPrice = 999;
   } if ($('#middlePrice').prop('checked')  ) {
      lowestPrice = 1000;
      highestPrice = 5000;
   } if ($('#highPrice').prop('checked')) {
      lowestPrice = 5001;
   } if ($('#lowPrice').prop('checked') && $('#middlePrice').prop('checked')) {
      lowestPrice = 0;
      highestPrice = 5000;
   } if ($('#middlePrice').prop('checked') && $('#highPrice').prop('checked')) {
      lowestPrice = 1000;
      highestPrice = 1000000000;
   } 
   if ($('#lowGears').prop('checked')) {
      highestGears = 4;
   } if ($('#highGears').prop('checked')) {
      lowestGears = 5;
   }
   if ($('#lowGears').prop('checked') && $('#highGears').prop('checked')) {
      lowestGears = 0;
      highestGears = 100000000;
   }
   if ($('#new').prop('checked')) {
      highestAge = 1;
   } if ($('#lowAge').prop('checked')) {
      lowestAge = 2;
      highestAge = 5;
   } if ($('#highAge').prop('checked')) {
      lowestAge = 6;
      highestAge = 1000000;
   }  if ($('#new').prop('checked') && $('#lowAge').prop('checked')) {
      lowestAge = 0;
      highestAge = 5;
   }  if ($('#lowAge').prop('checked') && $('#highAge').prop('checked')) {
      lowestAge = 2;
      highestAge = 1000000;
   } 
   if ($('#lowCondition').prop('checked')) {
      highestCondition = 2;
   } if ($('#highCondition').prop('checked')) {
      lowestCondition = 3;
   }
   if ($('#lowCondition').prop('checked') && $('#highCondition').prop('checked')) {
      lowestCondition = 1;
      highestCondition = 5;
   }
   
   
   var sortByValue = $('#selectSort').val();
 
   localStorage.setItem("sortOption", sortByValue);
   localStorage.setItem('lowPriceChecked', $('#lowPrice').prop('checked'));
   localStorage.setItem('middlePriceChecked', $('#middlePrice').prop('checked'));
   localStorage.setItem('highPriceChecked', $('#highPrice').prop('checked'));
   localStorage.setItem('lowGearsChecked', $('#lowGears').prop('checked'));
   localStorage.setItem('highGearsChecked', $('#highGears').prop('checked'));
   localStorage.setItem('newChecked', $('#new').prop('checked'));
   localStorage.setItem('lowAgeChecked', $('#lowAge').prop('checked'));
   localStorage.setItem('highAgeChecked', $('#highAge').prop('checked'));
   localStorage.setItem('lowConditionChecked', $('#lowCondition').prop('checked'));
   localStorage.setItem('highConditionChecked', $('#highCondition').prop('checked'));
   setTimeout(() => {
      setStoredOption();
   }, 1);
   $(".container").html($("#view-home").html());
   if (bike_category === 'BMX') {
      viewBMX(); 
   }
   if (bike_category === 'Mountain Bike') {
      viewMountainBike(); 
   }
   if (bike_category === 'Kid Bike') {
      viewKid(); 
   }
   if (bike_category === 'Electrical Bike') {
      viewEl(); 
   }
   if (bike_category === 'Alternative Bike') {
      viewAlternative(); 
   }
   $("#home-list").empty(); 
   $.ajax({
      url: host + '/bikes/' + bike_category,
      type: 'GET',
      success: function(bikes) {
         bikes = sortBikes(sortByValue, bikes);
         bikes.forEach(function (bike) {
            if (bike.is_listed) {
               if (bike.price >= lowestPrice && bike.price <= highestPrice) {
                  if (bike.gears >= lowestGears && bike.gears <= highestGears) {
                     if (bike.age >= lowestAge && bike.age <= highestAge) {
                        if (bike.condition >= lowestCondition && bike.condition <= highestCondition) {
                           var bikeView = `      
                              <a href="#" onclick="showBike(${bike.id}); return false;">
                              <div class="card mb-3" id ="card">
                              <img src="${bike.picture_path}" id="allBikes-pic">
                                 <div class="card-body allBikes">
                                    <div>
                                       <p class="card-text bike-title merriweather-regular">${bike.model} </p> 
                                       <p class="card-text merriweather-regular">${bike.category} </p>
                                       <p class="card-text merriweather-regular">${bike.price} SEK </p>
                                    </div>
                                 </div>
                              </div>
                           </a>`;
                           $("#home-list").append(bikeView);
                        }
                     }
                  }
               }
            }
         });
         currentCategoryValue = bike_category;
      },
      error: function() {
         alert("There are currrently no bikes of this category listed."); 
         viewHome();
      }
   });
 }
 function currentCategory() {
   return currentCategoryValue; // Return the current category value
}
// Function showBike() enter new script for specific bike
function showBike(bike_id) {
   $(".container").html($("#view-bike").html());
   $(".container0").hide();
   $("#bike-list").empty(); 
   var authData = sessionStorage.getItem('auth');
   if (authData !== null) {
      var currentUser = JSON.parse(sessionStorage.getItem('auth')).user;
      var user_id = currentUser.id;
   } else {
    console.log("Auth data is null");
    var user_id = null;
   }

   $.ajax({
      
      url: host + '/bikes/' + bike_id,
      type: 'GET',
      success: function(bike) {  
         var bikeView = `      
            <div class="card mb-3" id="card2">
               
               <img src="${bike.picture_path}" id="pic">
               <div class="card-body">
                        <h1 class="description-headline merriweather-regular">${bike.model} </h1> 
                        <p class="card-text merriweather-regular">Category: ${bike.category} </p>
                        <p class="card-text merriweather-regular">${bike.price} SEK</p>
                        <p class="card-text merriweather-regular">Gears: ${bike.gears} </p>
                        ${(() => {
                           let conditionText = '';
                           if (bike.condition === 1) {
                               conditionText = 'Poor';
                           } else if (bike.condition === 2) {
                               conditionText = 'Fair';
                           } else if (bike.condition === 3) {
                               conditionText = 'Good';
                           } else if (bike.condition === 4) {
                               conditionText = 'Very good';
                           } else if (bike.condition === 5) {
                               conditionText = 'Excellent';
                           } else {
                               conditionText = 'Unknown';
                           }
                           return `<p class="card-text merriweather-regular">Condition: ${conditionText} 
                           <link href="https://netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css" rel="stylesheet">
                       
                        
                           <div class="info">
                           <i class="icon-info-sign"></i>
                           <span class="extra-info">
                               <p><strong>Poor</strong> - The bike is almost not functional</p>
                               <p><strong>Fair</strong> - The bike has been used alot</p>
                               <p><strong>Good</strong> - The bike is in used condition</p>
                               <p><strong>Very good</strong> - The bike has been looked after but shows small signs of usage</p>
                               <p><strong>Excellent</strong> - The bike is almost brand new</p>
                           </span>
                       </div>
                       
                        </p>`;
                           
                       })()}
                        <p class="card-text merriweather-regular">Wheel size: ${bike.age} inches </p>
                        <button class="btn allbuttons" onclick="purchaseBikeButton(${bike.id})" data-id="${bike.id}">Purchase</button>
                        `;
                        
                      
                        bikeView += `</div>
                        </div>`;
         $("#bike-list").append(bikeView);
      },
      error: function() {
         console("Error fetching bike."); 
      }
   });
}

// Function displaying the users bikes for sale (and sold)
function showMyBikes() {
   $(".container").html($("#view-myBikes").html())
   $(".container0").hide();
   $("#myBikes-list").empty(); 
   var currentUser = JSON.parse(sessionStorage.getItem('auth')).user;
   var user_id = currentUser.id;
   $.ajax({
      url: host + '/users/' + user_id + '/bikes',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(bikes) {
         bikes.forEach(function (bike) {
         var bikeView = `      
            <div class="card mb-3" id="card4">
               <img src="${bike.picture_path}" id="allBikes-pic">
               <div class="card-body">
                  <div>
                     <h5 class="card-title">${bike.model} </h5> 
                     <p class="card-text merriweather-regular">Category: ${bike.category} </p>
                     <p class="card-text merriweather-regular">Price: ${bike.price} SEK </p>
                     <p class="card-text merriweather-regular">Gears: ${bike.gears} </p>
                     <p class="card-text merriweather-regular">Age: ${bike.age} </p>
                     <p class="card-text merriweather-regular">Condition: ${bike.condition} </p>
                     <p class="card-text boldText merriweather-regular"<strong>Status: </strong> ${bike.is_listed ? 'Bike is listed' : 'Bike is not listed'} </p>
                     <p class="card-text boldText merriweather-regular"<strong>Sold: </strong> ${bike.is_sold ? 'Yes' : 'No'} </p>
                  </div>`
               if (!bike.is_sold) {
                  bikeView += `
                  <button class = "btn allbuttons" id="delete-button" onclick = "deleteBike(${bike.id})">Delete</button>`;
               }
               bikeView += `
               </div>
             </div>`
         $("#myBikes-list").append(bikeView);
      });
      },
      error: function() {
         console("Error fetching bikes."); 
      }
   });
 
 }

// Function for uploading a new bike
function addBike() {
   $(".container").html($("#view-addBike").html())
   $(".container0").hide();
}

// Function for applying for posting bike
function uploadBike() {
   var newModel = $("#addModel").val();
   var newPrice = $("#addPrice").val();
   var newGears = Math.floor($("#addGears").val());
   var newAge = Math.floor($("#addAge").val());
   var newCondition = Math.floor($("#addCondition").val());
   var currentUser = JSON.parse(sessionStorage.getItem('auth')).user;
   var user_id = currentUser.id;
   var fileInput = document.getElementById('input-file').files[0];
   var newCategory = $("#addCategory").val();

   var formData = new FormData();
   formData.append('model', newModel);
   formData.append('price', newPrice);
   formData.append('gears', newGears);
   formData.append('age', newAge);
   formData.append('condition', newCondition);
   formData.append('user_id', user_id);
   formData.append('picture', fileInput);
   formData.append('category', newCategory);
   
   $.ajax({
      url: host + '/users/' + user_id + '/bikes',
      type: 'POST',
      contentType: false,
      processData: false,
      data: formData,
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(response) {
          console.log("Cykeluppladdning lyckades: ", response);
          $("#addModel, #addPrice, #addGears, #addAge, #addCondition, #addCategory, #input-file").val('');
          $("#addBikeModal").modal("hide");
          // Här kan du hantera svar från backend, t.ex. visa bekräftelsemeddelande för användaren
      },
      error: function(error) {
          console.error("Error uploading bike");
      }
  });
  alert("You have successfully submitted your application. After a thorough review by reCycle, it will be published on the website. You can see the status of your application on the 'My Bikes' page.");
  viewHome();

}

function makeOrder(bike_id) {
   console.log("make order function")
   var currentUser = JSON.parse(sessionStorage.getItem('auth'));
   var purchaseUserID = null;
   if (currentUser != null) {
      purchaseUserID = currentUser.user.id;
   }
   $.ajax({
      url: host + '/orders',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({buyer_id: purchaseUserID, bike_id: bike_id}),
      success: function() {
         console.log("Order was successfully added");
      },
      error: function() {
         console.log("Order was not successful!");
      } 
   });
}

// Function purchaseBikeButton
function purchaseBikeButton(bike_id) {
   console.log("Purchase button");
   makeOrder(bike_id);
   $.ajax({
      url: host + '/create-checkout-session',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ bike_id: bike_id}),
      success: function(response) {
         location.href = response;
      },
      error: function() {
         alert("Error purchasing bike.");
      } 
   });
}

function deleteLatestOrder(){
   console.log("delete latest order");
   $.ajax({
      url: host + '/orders',
      type: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify(),
      success: function(bike_id) {
         console.log("The latest order was deleted");
      },
      error: function() {
         console.log("No order was deleted");
      } 
   });
}

// Function to enter my account from navbar dropdown using a modal
function showAccount() {
   $(".container").html($("#view-account").html())
   $(".container0").hide();
   $("#account-list").empty(); 
   var currentUser = JSON.parse(sessionStorage.getItem('auth')).user;
   var user_id = currentUser.id;
   $.ajax({
      url: host + '/users/' + user_id,
      type: 'GET',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(user) {
         var userView = $(`   
            <div class="card3" style="width: 18rem;">
               <img src="images/Bild1.png" id="profile_icon2">
               </div>
               <div class="card-body">
                  <h5 class="card-title merriweather-regular">Name: ${user.name}</h5>
                  <p class="card-text merriweather-regular">E-mail: ${user.email} </p>
                  <button class="btn allbuttons" data-toggle="modal" data-target="#editAccountModal" onclick="editUser(${user.id})">Edit information</button>
               </div>
            </div>`);
         $("#account-list").append(userView);
      }
   });
}

// Function showOrder() enter new script for specific bike
function showMyOrders() {
   $(".container").html($("#view-myOrders").html())
   $(".container0").hide();
   $("#myOrders-list").empty(); 
   var currentUser = JSON.parse(sessionStorage.getItem('auth')).user;
   var user_id = currentUser.id;
 
   $.ajax({
      url: host + '/users/' + user_id + '/orders',
      type: 'GET',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(bikes) {
         bikes.forEach(function (bike) {
            var bikeView = `      
            <div class="card mb-3" id="card5">
            <img src="${bike.picture_path}" id="allBikes-pic">
            <div class="card-body">
                        <h5 class="card-title merriweather-regular">${bike.model} </h5>
                        <p class="card-text merriweather-regular">Category: ${bike.category} </p>
                        <p class="card-text merriweather-regular">Price: ${bike.price} SEK </p>
                     </div>
                  </div>`
            $("#myOrders-list").append(bikeView);
         });
      }
   })
 }

//opening edit modal
function editUser(user_id) {
   $('iframe[src*=chatbase]').hide();
   $('#editAccountModal').modal();
   $.ajax({
         url: host + '/users/' + user_id, 
         type: 'GET',
         headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
         success: function(user) {
            $("#editName").val(user.name);
            $("#editEmail").val(user.email);
            $("#editUserID").val(user.id);
         },
         error: function(error) {
            console.error("Error fetching user data for editing:", error);
         }
      });
}

// Save the edited user information
function saveChanges() {
   var user_id = Math.floor($("#editUserID").val());
   var updatedName = document.getElementById('editName').value;
   var updatedEmail = document.getElementById('editEmail').value;

   $.ajax({
      url: host + '/users/' + user_id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ 
         user_id: user_id,
         name: updatedName, 
         email: updatedEmail,
         }),
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function() {
         console.log("ajax success");
         $("#editName, #editEmail").val('');
         $("#editAccountModal").modal("hide");
      },
      error: function() {
         console.log("Error editing account.");
      } 
   }); 
   setTimeout(() => {
      showAccount();
   }, 1000);
  
}

// sign in page
function signInPage() {
   $(".container").html($("#view-sign-up").html())
   $(".container0").hide();
}

// submit signup
function signIn(){

   var newName = document.getElementById("exampleInputName").value;
   var newEmail = document.getElementById("exampleInputEmail1").value;
   var newPassword = document.getElementById("exampleInputPassword").value;
   console.log(newName);
   $.ajax({
      url: host + '/sign-up',
      type: 'POST',
      contentType: 'application/json', 
      data: JSON.stringify({
         name: newName, 
         email: newEmail, 
         password: newPassword}), 
      success: function(newUser) {
         console.log("ajax success"); 
      },
      error: function(error) {
         console.error("Error adding user:", error);
      }
   });
   viewHome()
}

// log in page
function logInPage(){
   $(".container").html($("#view-login").html())
   $(".container0").hide();
}

// submit log in
function logIn() {
   var email = document.getElementById("inputEmail").value;
   var password = document.getElementById("inputPassword").value;
  
   $.ajax({
      url: host + '/login',
      type: 'POST',
      contentType: 'application/json', 
      data: JSON.stringify({ 
         email: email, 
         password: password}), 
      success: function(loginResponse) {;
         sessionStorage.setItem('auth', JSON.stringify(loginResponse));
      },
      error: function(error) {
         alert("Wrong password!");
         console.error("Error signing in user:", error);
      }
   });
   viewHome();
}  

// Log out
function logOut() {
   sessionStorage.removeItem("auth");
   viewHome();
}

//  This executes when document is loaded
 $(document).ready(function(){
    sessionStorage.removeItem("auth");
    viewHome()
 });


 // Function to delete listed but not sold bike
 function deleteBike(bike_id) {
   var currentUser = JSON.parse(sessionStorage.getItem('auth')).user;
   var id = currentUser.id;
   $.ajax({
      url: host + '/bikes/' + bike_id,
      type: 'DELETE',
      success: function() {
         console.log("Delete successful");
      },
      error: function() {
         alert("Error deleting bike.");
      } 
   });
   setTimeout(() => {
      showMyBikes();
   }, 1000);
}

// Opening modal of editing bike
$(".container").on("click", ".edit-bike", function (e) {
   e.preventDefault();
   var bike_id = $(this).data('id');

   $.ajax({
      url: host + '/bikes/' + bike_id, 
      type: 'GET',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(bike) {
         $("#editPrice").val(bike.price);
         $("#editModel").val(bike.model);
         if (bike.user != null) $("#editUserID").val(bike.user.id);
         $("#editBikeForm").data("bike-id", bike_id); 
         $("#editBikeModal").modal("show");
      },
      error: function(error) {
         console.error("Error fetching bike data for editing:", error);
      }
   });
});

// Submit edit of bike
$("#editBikeForm").submit(function (e) {
   e.preventDefault();
   var bike_id = $(this).data("bike-id");
   var updatedPrice = $("#editPrice").val();
   var updatedModel = $("#editModel").val();
   var updatedUserID = $("#editUserID").val();
   var updatedCategory = $("#editCategory").val();

   $.ajax({
      url: host + '/bikes/' + bike_id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ price: updatedPrice, model: updatedModel,category: updatedCategory,user_id:updatedUserID}),
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(bike) {
         console.log("Ajax success");
         displayBikes();
         $("#editPrice, #editModel, #editUserID, #editCategory").val('');
         $("#editBikeModal").modal("hide");
      },
      error: function() {
         alert("Error editing bike.");
      } 
   });
});
function reloadShowBike(bikeId) {
   showBike(bikeId);
}


const inputBox = document.getElementById("input-text");
const searchForm = document.getElementById("searchForm");
const resultsBox = document.querySelector(".result-box");

inputBox.addEventListener("input", search);
searchForm.addEventListener("submit", handleSearch);

document.addEventListener('click', function(event) {
   var searchBox = document.querySelector('.search-box');
   var resultBox = document.querySelector('.result-box');
   var inputText = document.getElementById('input-text');

   if (!searchBox.contains(event.target) && !resultBox.contains(event.target) && event.target !== inputText) {

       resultBox.style.display = 'none';
   }
});

document.getElementById('input-text').addEventListener('input', function(event) {
   var resultBox = document.querySelector('.result-box');
   var inputText = document.getElementById('input-text');

   resultBox.style.display = 'block';
   
});

function search() {
   let availableKeywords = [
      'BMX',
      'Mountain Bike',
      'Electrical Bike',
      'Buy Electrical',
      'Hardcore',
      'Sustainable',
      'Small',
      'Kid',
      'Street'
   ];
   let input = inputBox.value;



   let result = availableKeywords.filter((keyword)=>{
      return keyword.toLowerCase().includes(input.toLowerCase());
   });

   display(result);
}


function display(result) {

   const content = result.map((list)=>{
      return "<li onclick=selectInput(this)>" + list + "</li>"
   });

   resultsBox.innerHTML = "<ul>" + content.join('') + "</ul>";
}


function selectInput(list) {

   inputBox.value = list.innerHTML;

   const inputValueLowerCase = inputBox.value.toLowerCase();
   console.log("Input value:", inputBox.value);

   if (inputValueLowerCase.includes('electrical') || inputValueLowerCase.includes('sustainable')) {
      console.log("Redirecting to Electrical Bike page...");
      alert("Redirecting to Electrical Bike page...");
      displayBikeCategory('Electrical Bike');
   } else if (inputValueLowerCase.includes('bmx') || inputValueLowerCase.includes('street')) {
      console.log("Redirecting to BMX page...");
      alert("Redirecting to BMX page...");
      displayBikeCategory('BMX');
   } else if (inputValueLowerCase.includes('mountain') || inputValueLowerCase.includes('hardcore')) {
      console.log("Redirecting to Mountain Bike page...");
      alert("Redirecting to Mountain Bike page...");
      displayBikeCategory('Mountain Bike');
   } else if (inputValueLowerCase.includes('small') || inputValueLowerCase.includes('kid')) {
      console.log("Redirecting to Kid page...");
      alert("Redirecting to Kid page...");
      displayBikeCategory('Kid Bike');
   }
   else {
      console.log("Displaying all bikes...");
      displayAllBikes();
   }

   resultsBox.innerHTML = '';
}

function handleSearch(event) {
   event.preventDefault(); 
   const input = document.getElementById("input-text").value.trim().toLowerCase();


   if (input.includes('electrical') || input.includes('electric') || input.includes('e-bike') || input.includes('sustainable') || input.includes('eco-friendly') || input.includes('battery') || input.includes('powered') || input.includes('rechargeable')) {
       console.log("Redirecting to Electrical Bike page...");
       alert("Redirecting to Electrical Bike page...")
       displayBikeCategory('Electrical Bike');
   } else if (input.includes('bmx') || input.includes('street') || input.includes('freestyle') || input.includes('trick')) {
       console.log("Redirecting to BMX page...");
       alert("Redirecting to BMX page...");
       displayBikeCategory('BMX');
   } else if (input.includes('mountain') || input.includes('hardcore') || input.includes('off-road') || input.includes('trail') || input.includes('downhill') || input.includes('cross-country')) {
       console.log("Redirecting to Mountain Bike page...");
       alert("Redirecting to Mountain Bike page...");
       displayBikeCategory('Mountain Bike');
   } else if (input.includes('small') || input.includes('kid') || input.includes('children') || input.includes('youth') || input.includes('mini') || input.includes('junior')) {
       console.log("Redirecting to Kid page...");
       alert("Redirecting to Kid page...");
       displayBikeCategory('Kid Bike');
   } else {
       console.log("Displaying all bikes...");
       displayAllBikes();
   }
}


   resultsBox.innerHTML = '';


function viewJoin() {
   $(".container").html($("#join-us").html());
   $(".container0").hide();
 }

