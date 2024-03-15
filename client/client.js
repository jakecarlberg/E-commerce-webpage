host = window.location.protocol + '//' + location.host

function viewHome() {
    $(".container").html($("#view-home").html())
    displayAllBikes();
}

// Function to fetch and display bikes in View bikes script
function displayAllBikes() {
   $(".container").html($("#view-home").html())
   $("#bike-list").empty(); 
   $.ajax({
      url: host + '/bikes',
      type: 'GET',
      success: function(bikes) {
         bikes.forEach(function (bike) {
            var bikeView = $(`      
               <div class="card mb-3">
                  <div class="card-body">
                     <p </p>
                  </div>
                  <div class="d-flex justify-content-center">
                     <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                     </div>
                  </div>                  
                  <div class="card-body">
                     <h5 class="card-title">${bike.model} </h5> 
                     <p class="card-text">Price: ${bike.price} </p>
                     <button class="btn btn-success purchase-bike" onclick="showBike(${bike.id})" data-id="${bike.id}">Read more</button>
                  </div>
               </div>`);
            //Img class will not contain image in webbsida_1, it's sketchy
            $("#bike-list").append(bikeView);
         });
      },
      error: function() {
         alert("Error fetching bikes."); 
      }
   });
}

// Function checking if the user is signed in
function signedIn(){
   var authInfo = sessionStorage.getItem('auth');
   return authInfo.length > 0;
}

// Function showBike() enter new script for specific bike
function showBike(bike_id) {
   $(".container").html($("#view-bike").html())
   $("#bike-list").empty(); 
   $.ajax({
      url: host + '/bikes/' + bike_id,
      type: 'GET',
      success: function(bike) {
         var bikeView = $(`      
            <div class="card mb-3">
            <img class="card-img-top" src="/ReCycle.png" alt= "Card image cap" >
               <div class="card-body">
                  <h5 class="card-title">${bike.model} </h5> 
                  <p class="card-text">Price: ${bike.price} </p>
                  <p class="card-text">Gears: ${bike.description} </p>
                  <button class="btn btn-success purchase-bike" onclick="purchaseBikebutton(${bike.id})" data-id="${bike.id}">Purchase</button>
               </div>
            </div>`);
         $("#bike-list").append(bikeView);
      },
      error: function() {
         alert("Error fetching bikes."); 
      }
   });
}

// Function purchaseBikeButton() enter new script for buyer to complete their order
function purchaseBikeButton(bike_id) {
   e.preventDefault();

   $.ajax({
      url: host + '/orders',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ user_id: purchaseUserID}),
      success: function(response) {
         console.log("Bokad bil", response);
         alert(response)
         displayBikes();
      },
      error: function() {
         alert("Error purchasing bike.");
      } 
   });
}

// Function to enter my account from navbar dropdown using a modal
function showAccount() {
   $(".container").html($("#view-account").html())
   $("#view-list").empty(); 
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
         $("#view-list").append(userView);
      }
   });
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
   const user_id = Math.floor(document.getElementById('editUserID').value);
   const updatedName = document.getElementById('editName').value;
   const updatedEmail = document.getElementById('editEmail').value;

   $.ajax({
      url: host + '/users/' + user_id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ name: updatedName, email: updatedEmail, user_id: user_id}),
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function() {
         $("#editName, #editEmail").val('');
         $("#editAccountModal").modal("hide");
         showAccount();
         alert(updatedName);
      },
      error: function() {
         alert("Error editing account.");
      } 
   });   
}

//  This executes when document is loaded
 $(document).ready(function(){
    alert("Page was loaded");
    viewHome()
    $(".dropdown-item:contains('Sign out')").toggleClass('d-none')
    $(".nav-link:contains('My profile')").toggleClass('d-none')
 });


//  Click functions on Navbar


$(".nav-link:contains('Home')").click(function (e) {
   e.preventDefault();
   viewHome()
});

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

$(".dropdown-item:contains('Sign out')").click(function (e) {
   e.preventDefault();
   viewHome();
   sessionStorage.removeItem("auth");
   $(".nav-link:contains('Sign up')").toggleClass('d-none', false)
   $(".nav-link:contains('Log in')").toggleClass('d-none', false)
   $(".dropdown-item:contains('Sign out')").toggleClass('d-none', true)
   $(".nav-link:contains('My profile')").toggleClass('d-none', true)
});


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
         console.log(bike);
         displayBikes();
         $("#editPrice, #editModel, #editUserID").val('');
         $("#editBikeModal").modal("hide");
      },
      error: function() {
         alert("Error editing bike.");
      } 
   });
});


// Opening modal of adding bike
$(".container").on("click", "#addBike", function (e) {
   $("#addPrice, #addModel, #addUserID").val('');
});


// Submitting the newly added bike
$("#addBikeForm").submit(function (e) {
   e.preventDefault();
   var newPrice = $("#addPrice").val();
   var newModel = $("#addModel").val();
   var newUserID = $("#addUserID").val();

   $.ajax({
      url: host + '/bikes',
      type: 'POST',
      contentType: 'application/json', 
      data: JSON.stringify({ price: newPrice, model: newModel, user_id: newUserID }), 
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(newBike) {
         console.log(newBike); 
         displayBikes();
         $("#addPrice, #addModel, #addUserID").val('');
         $("#addBikeModal").modal("hide");
      },
      error: function(error) {
         console.error("Error adding bike:", error);
      }
   });
});


// submit sign up
$(".container").on("submit", "#form2", function (e) {
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
         console.log(newUser); 
      },
      error: function(error) {
         console.error("Error adding user:", error);
      }
   });
   viewHome()
});


// submit log in
$(".container").on("submit", "#form3", function (e) {
   e.preventDefault();

   var email = $("#exampleInputEmail1").val();
   var password = $("#exampleInputPassword").val();
  
   $.ajax({
      url: host + '/login',
      type: 'POST',
      contentType: 'application/json', 
      data: JSON.stringify({ email: email, password: password}), 
      success: function(loginResponse) {;
         sessionStorage.setItem('auth', JSON.stringify(loginResponse));
      },
      error: function(error) {
         console.error("Error adding user:", error);
      }
   });
   viewHome()
   $(".nav-link:contains('Sign up')").toggleClass('d-none', signedIn())
   $(".nav-link:contains('Log in')").toggleClass('d-none', signedIn())
   $(".dropdown-item:contains('Sign out')").toggleClass('d-none', !signedIn())
   $(".nav-link:contains('My profile')").toggleClass('d-none', !signedIn())
});   


// Submit contact form in View Contacts script
 $(".container").on("submit", "#form1", function (e) {
   e.preventDefault();

   var name = $("#exampleInputName").val();
   var email = $("#exampleInputEmail1").val();
   var message = $("#exampleInputMessage").val();
   var consentChecked = $("#exampleCheck1").is(":checked");

   alert("Name: " + name + "\nEmail: " + email + "\nMessage: " + message + "\nConsent Checked: " + consentChecked);
});
