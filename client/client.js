host = window.location.protocol + '//' + location.host

function viewHome() {
   setTimeout(updateNavbar, 400);
   displayAllBikes();
}

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
   $('#sign_up, #log_in').toggleClass('d-none', signedIn);
   $('#applications, #messages, #orders').toggleClass('d-none', !isAdmin);
   $('#my_profile').toggleClass('d-none', !signedIn);
}

// Function to view applications
function viewApplications() {
   $(".container").html($("#view-applications").html())
   $("#applications-list").empty();
   $.ajax({
      url: host + '/bikes',
      type: 'GET',
      success: function(bikes) {
         bikes.forEach(function (bike) {
            if (!bike.is_listed && !bike.is_sold) {
               var bikeView = $(`     
               <div class="card mb-3"> 
                  <img src="${bike.picture_path}" id="pic">             
                  <div class="card-body">
                     <h5 class="card-title">${bike.model} </h5>
                     <p class="card-text">Price: ${bike.price} SEK</p>
                     <button class="btn btn-primary" onclick="listBike(${bike.id})" data-id="${bike.id}">Approve</button>
                  </div>
               </div>`);
               $("#applications-list").append(bikeView);
            }
         });
      },
      error: function() {
         alert("Error fetching bikes.");
      }
   });
}

// Function to view orders as admin
function viewOrders() {
   $(".container").html($("#view-orders").html())
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
                  console.log("AJNAJAJAJA DET BRINNER");
               }
            });
            setTimeout(function() {
            var orderView = $(`      
               <div class="card mb-3">       
                  <img src="${bike.picture_path}" id="pic">      
                  <div class="card-body">
                     <h5 class="card-title">Bike: (${bike.id}) ${bike.model} </h5>
                     <p class="card-text">Payment to seller: ${bike.price - 50} SEK</p>   
                     <p class="card-text">Fee: 50 SEK </p>   
                     <p class="card-text">Seller: ${seller_email} </p>
                  </div>
               </div>`);
            $("#orders-list").append(orderView);
            }, 400);
            }
         });
      },
      error: function() {
         alert("Error fetching bikes."); 
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
                     <h5 class="card-title">Name: ${message.name}</h5> 
                     <h5 class="card-title">E-mail: ${message.email} </h5> 
                     <p class="card-text">Message: ${message.message} </p>
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
  console.log(lowestAge);
  console.log(highestAge);
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
   $("#home-list").empty(); 
 
   $.ajax({
      url: host + '/bikes',
      type: 'GET',
      success: function(bikes) {
         // bikes = filterBikes(priceValue, gearsValue, ageValue, conditionValue, bikes);
         bikes = sortBikes(sortByValue, bikes);
         bikes.forEach(function (bike) {
            if (bike.is_listed) {
               if (bike.price >= lowestPrice && bike.price <= highestPrice) {
                  if (bike.gears >= lowestGears && bike.gears <= highestGears) {
                     if (bike.age >= lowestAge && bike.age <= highestAge) {
                        if (bike.condition >= lowestCondition && bike.condition <= highestCondition) {
                           var bikeView = `      
                              <div class="card mb-3">
                              <img src="${bike.picture_path}" id="pic">
                                 <div class="card-body">
                                    <h5 class="card-title">${bike.model} </h5> 
                                    <p class="card-text">Price: ${bike.price} SEK </p>
                                    <button class="btn btn-success purchase-bike" onclick="showBike(${bike.id})" data-id="${bike.id}">Read more</button>
                                 </div>
                              </div>`
                           $("#home-list").append(bikeView);
                        }
                     }
                  }
               }
            }
         });
      },
      error: function() {
         alert("Error fetching bikes."); 
      }
   });
}

// Function showBike() enter new script for specific bike
function showBike(bike_id) {
   $(".container").html($("#view-bike").html())
   $("#bike-list").empty(); 
   $.ajax({
      url: host + '/bikes/' + bike_id,
      type: 'GET',
      success: function(bike) {
         var bikeView = `      
            <div class="card mb-3">
               <div class="card-body">
                  <p </p>
               </div>
               <img src="${bike.picture_path}" id="pic">
            <div class="card-body">
                        <h5 class="card-title">${bike.model} </h5> 
                        <p class="card-text">Price: ${bike.price} SEK</p>
                        <p class="card-text">Gears: ${bike.gears} </p>
                        <p class="card-text">Condition: ${bike.condition} </p>
                        <p class="card-text">Age: ${bike.age} </p>
                        <button class="btn btn-success purchase-bike" onclick="purchaseBikeButton(${bike.id})" data-id="${bike.id}">Purchase</button>
                     </div>
               </div>`
         $("#bike-list").append(bikeView);
      },
      error: function() {
         alert("Error fetching bike."); 
      }
   });
}

// Function displaying the users bikes for sale (and sold)
function showMyBikes() {
   $(".container").html($("#view-myBikes").html())
   $("#myBikes-list").empty(); 
   var currentUser = JSON.parse(sessionStorage.getItem('auth')).user;
   var user_id = currentUser.id;
   $.ajax({
      url: host + '/users/' + user_id + '/bikes',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(bikes) {
         bikes.forEach(function (bike) {
         var bikeView = `      
            <div class="card mb-3">
               <div class="card-body">
               <p </p>
               </div>
               <img src="${bike.picture_path}" id="pic">
               <div class="card-body">
                  <h5 class="card-title">${bike.model} </h5> 
                  <p class="card-text">Price: ${bike.price} SEK </p>
                  <p class="card-text">Gears: ${bike.gears} </p>
                  <p class="card-text">Age: ${bike.age} </p>
                  <p class="card-text">Condition: ${bike.condition} </p>
                  <p class="card-text">isListed: ${bike.is_listed} </p>
                  <p class="card-text">isSold: ${bike.is_sold} </p>
               </div>
             </div>`
         $("#myBikes-list").append(bikeView);
      });
      },
      error: function() {
         alert("Error fetching bikes."); 
      }
   });

}

// Function for uploading a new bike
function addBike() {
   $(".container").html($("#view-addBike").html())
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

   var formData = new FormData();
   formData.append('model', newModel);
   formData.append('price', newPrice);
   formData.append('gears', newGears);
   formData.append('age', newAge);
   formData.append('condition', newCondition);
   formData.append('user_id', user_id);
   formData.append('picture', fileInput);
   
   $.ajax({

      url: host + '/users/' + user_id + '/bikes',
      type: 'POST',
      contentType: false,
      processData: false,
      data: formData,
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(response) {
          console.log("Cykeluppladdning lyckades: ", response);
          $("#addModel, #addPrice, #addGears, #addAge, #addCondition, #input-file").val('');
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

// Function purchaseBikeButton() enter new script for buyer to complete their order
function purchaseBikeButton(bike_id) {
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
   $("#account-list").empty(); 
   var currentUser = JSON.parse(sessionStorage.getItem('auth')).user;
   var user_id = currentUser.id;
   $.ajax({
      url: host + '/users/' + user_id,
      type: 'GET',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(user) {
         var userView = $(`   
            <div class="card" style="width: 18rem;">
               <div class="card-body">
                  <p </p>
               </div>
               <div class="d-flex justify-content-center">
                  <div class="spinner-border" role="status">
                     <span class="sr-only">Loading...</span>
                  </div>
               </div>
               <div class="card-body">
                  <h5 class="card-title">${user.name}</h5>
                  <p class="card-text">E-mail: ${user.email} </p>
                  <button class="btn btn-primary" data-toggle="modal" data-target="#editAccountModal" onclick="editUser(${user.id})">Edit information</button>
               </div>
            </div>`);
         $("#account-list").append(userView);
      }
   });
}

// Function showOrder() enter new script for specific bike
function showMyOrders() {
   $(".container").html($("#view-myOrders").html())
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
            <div class="card mb-3">
            <div class="card-body">
            <p </p>
            </div>
            <img src="${bike.picture_path}" id="pic">
            <div class="card-body">
                        <h5 class="card-title">${bike.id} </h5> 
                        <p class="card-text">Price: ${bike.price} SEK </p>
                     </div>
                  </div>`
            $("#myOrders-list").append(bikeView);
         });
      }
   })
 }

//opening edit modal
function editUser(user_id) {
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

//  This executes when document is loaded
 $(document).ready(function(){
    alert("Page was loaded");
    sessionStorage.removeItem("auth");
    viewHome()
 });

//  Click functions on Navbar

//Contact-page will not be available on webbsida_1
//  $(".nav-link:contains('Kontakt')").click(function (e) {
//     e.preventDefault();
//     $(".container").html($("#view-contacts").html())
//  });

$(".nav-link:contains('Sign up')").click(function (e) {
   e.preventDefault();
   $(".container").html($("#view-sign-up").html())

});

$(".nav-link:contains('Log in')").click(function (e) {
   e.preventDefault();
   $(".container").html($("#view-login").html())
});

// Log out
function logOut() {
   sessionStorage.removeItem("auth");
   viewHome();
}

// Click functions

// Delete bike
$(".container").on("click", ".delete-bike", function (e) {
   e.preventDefault();
   var bike_id = $(this).data('id');

   $.ajax({
      url: host + '/bikes/' + bike_id,
      type: 'DELETE',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(response) {
         $(this).closest(".card").remove();
      },
      error: function() {
         alert("Error deleting bike.");
      } 
   });
   $(this).closest(".card").remove();
});

// Cancel bike
$(".container").on("click", ".cancel-bike", function (e) {
   e.preventDefault();
   var bike_id = $(this).data('id');

   $.ajax({
      url: host + '/bikes/' + bike_id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ user_id: 0}),
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(response) {
         console.log("Avbokad bil", response);
         displayBikes();
      },
      error: function() {
         alert("Error cancelling bike.");
      } 
   });
});

// Updating bike
$(".container").on("click", "#update", function (e) {
   e.preventDefault();
   displayBikes();
   alert("Sidan uppdaterades")
});

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

   $.ajax({
      url: host + '/bikes/' + bike_id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ price: updatedPrice, model: updatedModel, user_id: updatedUserID}),
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(bike) {
         console.log("Ajax success");
         displayBikes();
         $("#editPrice, #editModel, #editUserID").val('');
         $("#editBikeModal").modal("hide");
      },
      error: function() {
         alert("Error editing bike.");
      } 
   });
});

// submit sign up
$(".container").on("submit", "#signupForm", function (e) {
   e.preventDefault();

   var newName = $("#exampleInputName").val();
   var newEmail = $("#exampleInputEmail1").val();
   var newPassword = $("#exampleInputPassword").val();
  
   $.ajax({
      url: host + '/sign-up',
      type: 'POST',
      contentType: 'application/json', 
      data: JSON.stringify({name: newName, email: newEmail, password: newPassword}), 
      success: function(newUser) {
         console.log("ajax success"); 
      },
      error: function(error) {
         console.error("Error adding user:", error);
      }
   });
   viewHome()
});

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

