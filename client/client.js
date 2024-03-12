host = window.location.protocol + '//' + location.host

function viewHome() {
    $(".container").html($("#view-home").html())
}

// Function to fetch and display bikes in View bikes script
function displayBikes() {
   $(".container").html($("#view-bikes").html())
   $("#bike-list").empty(); 
   $.ajax({
      url: host + '/bikes',
      type: 'GET',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(bikes) {
         bikes.forEach(function (bike) {
            var bikeView = `      
               <div class="card mb-3">
                  <div class="card-body">
                     <h5 class="list-group-item">${bike.price} ${bike.model}</h5> `

            if (JSON.parse(sessionStorage.getItem('auth')).user.is_admin) {
               bikeView += `
                  <p class="card-text"><strong>Aktuell Hyrestagare:</strong> ${bike.user ? bike.user.name : 'Ledig'}</p>
                  <p class="card-text">Här kan du radera samt redigera information om bilarna.</p>
                  <button class="btn btn-info edit-bike" data-id="${bike.id}">Redigera</button>
                  <button class="btn btn-warning delete-bike" data-id="${bike.id}">Radera</button>`;
            } else { 
               var userExist = (bike.user ? bike.user.id : 'N/A');
               if (userExist != 'N/A') {
                  bikeView += `
                  <p class="card-text"><strong>Aktuell Hyrestagare:</strong> ${bike.user ? bike.user.name : 'Ledig'}</p>`;
                  if (bike.user.id == JSON.parse(sessionStorage.getItem('auth')).user.id){
                     bikeView += `
                     <p class="card-text">Här kan du avboka bilen.</p>
                     <button class="btn btn-danger cancel-bike" data-id="${bike.id}">Avboka</button>`;
                  }
               } else {
                  bikeView += `
                     <p class="card-text">Här kan du boka bilen.</p>
                     <button class="btn btn-success purchase-bike" data-id="${bike.id}">Boka</button>`;
               }
            }

            bikeView += `</div></div>`;
            $("#bike-list").append(bikeView);
         });
      },
      error: function() {
         alert("Error fetching bikes."); 
      }
   });
}

// Function checking if the user is signed in (only necessary for listing bike)
function signedIn(){
   var authInfo = sessionStorage.getItem('auth');
   return authInfo.length > 0;
}

//  This executes when document is loaded
 $(document).ready(function(){
    alert("Sidan laddades");
    viewHome()
    $(".nav-link:contains('Logga ut')").toggleClass('d-none')
    $(".nav-link:contains('Bilar')").toggleClass('d-none')
 });


//  Click functions on Navbar
// Ideally, the displayBikes() should be on the home site 
$(".nav-link:contains('Hem')").click(function (e) {
   e.preventDefault();
   viewHome()
});

 $(".nav-link:contains('Kontakt')").click(function (e) {
    e.preventDefault();
    $(".container").html($("#view-contacts").html())
 });

 $(".nav-link:contains('Bilar')").click(function (e) {
   e.preventDefault();
   
   if (signedIn()) {
      displayBikes();
   } else {
      alert("User is not logged in!");
      viewHome();
   }
 });

$(".nav-link:contains('Registrera dig')").click(function (e) {
   e.preventDefault();
   $(".container").html($("#view-register").html())

});

$(".nav-link:contains('Logga in')").click(function (e) {
   e.preventDefault();
   $(".container").html($("#view-login").html())
});

$(".nav-link:contains('Logga ut')").click(function (e) {
   e.preventDefault();
   viewHome();
   sessionStorage.removeItem("auth");
   $(".nav-link:contains('Registrera dig')").toggleClass('d-none', false)
   $(".nav-link:contains('Logga in')").toggleClass('d-none', false)
   $(".nav-link:contains('Logga ut')").toggleClass('d-none', true)
   $(".nav-link:contains('Bilar')").toggleClass('d-none', true)
});


// Delete bike
$(".container").on("click", ".delete-bike", function (e) {
   e.preventDefault();
   var bike_id = $(this).data('id');

   $.ajax({
      url: host + '/bikes/' + bike_id,
      type: 'DELETE',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(response) {
         console.log("Hejdå bil", response);
         $(this).closest(".card").remove();
      },
      error: function() {
         alert("Error deleting bike.");
      } 
   });
   $(this).closest(".card").remove();
});


// purchase bike
$(".container").on("click", ".purchase-bike", function (e) {
   e.preventDefault();
   var bike_id = $(this).data('id');
   var purchaseUserID = JSON.parse(sessionStorage.getItem('auth')).user.id;

   $.ajax({
      url: host + '/bikes/' + bike_id + '/purchasing',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ user_id: purchaseUserID}),
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(response) {
         console.log("Bokad bil", response);
         alert(response)
         displayBikes();
      },
      error: function() {
         alert("Error purchasing bike.");
      } 
   });
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


// submit signin
$(".container").on("submit", "#form2", function (e) {
   e.preventDefault();

   var newName = $("#exampleInputName").val();
   var newEmail = $("#exampleInputEmail1").val();
   var newPassword = $("#exampleInputPassword").val();
  
   $.ajax({
      url: host + '/sign-up',
      type: 'POST',
      contentType: 'application/json', 
      data: JSON.stringify({ name: newName, email: newEmail, password: newPassword}), 
      success: function(newUser) {
         console.log(newUser); 
      },
      error: function(error) {
         console.error("Error adding user:", error);
      }
   });
   viewHome()
});


// submit login
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
   $(".nav-link:contains('Registrera dig')").toggleClass('d-none', signedIn())
   $(".nav-link:contains('Logga in')").toggleClass('d-none', signedIn())
   $(".nav-link:contains('Logga ut')").toggleClass('d-none', !signedIn())
   $(".nav-link:contains('Bilar')").toggleClass('d-none', !signedIn())
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
