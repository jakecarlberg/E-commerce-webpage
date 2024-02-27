host = window.location.protocol + '//' + location.host

function viewHome() {
    $(".container").html($("#view-home").html())
}

// Function to fetch and display cars in View Cars script
function displayCars() {
   $(".container").html($("#view-cars").html())
   $("#car-list").empty(); 
   $.ajax({
      url: host + '/cars',
      type: 'GET',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(cars) {
         cars.forEach(function (car) {
            var carView = `      
               <div class="card mb-3">
                  <div class="card-body">
                     <h5 class="list-group-item">${car.make} ${car.model}</h5> `

            if (JSON.parse(sessionStorage.getItem('auth')).user.is_admin) {
               carView += `
                  <p class="card-text"><strong>Aktuell Hyrestagare:</strong> ${car.user ? car.user.name : 'Ledig'}</p>
                  <p class="card-text">Här kan du radera samt redigera information om bilarna.</p>
                  <button class="btn btn-info edit-car" data-id="${car.id}">Redigera</button>
                  <button class="btn btn-warning delete-car" data-id="${car.id}">Radera</button>`;
            } else { 
               var userExist = (car.user ? car.user.id : 'N/A');
               if (userExist != 'N/A') {
                  carView += `
                  <p class="card-text"><strong>Aktuell Hyrestagare:</strong> ${car.user ? car.user.name : 'Ledig'}</p>`;
                  if (car.user.id == JSON.parse(sessionStorage.getItem('auth')).user.id){
                     carView += `
                     <p class="card-text">Här kan du avboka bilen.</p>
                     <button class="btn btn-danger cancel-car" data-id="${car.id}">Avboka</button>`;
                  }
               } else {
                  carView += `
                     <p class="card-text">Här kan du boka bilen.</p>
                     <button class="btn btn-success book-car" data-id="${car.id}">Boka</button>`;
               }
            }

            carView += `</div></div>`;
            $("#car-list").append(carView);
         });
      },
      error: function() {
         alert("Error fetching cars."); 
      }
   });
}

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
      displayCars();
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


// Delete car
$(".container").on("click", ".delete-car", function (e) {
   e.preventDefault();
   var car_id = $(this).data('id');

   $.ajax({
      url: host + '/cars/' + car_id,
      type: 'DELETE',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(response) {
         console.log("Hejdå bil", response);
         $(this).closest(".card").remove();
      },
      error: function() {
         alert("Error deleting car.");
      } 
   });
   $(this).closest(".card").remove();
});


// Book car
$(".container").on("click", ".book-car", function (e) {
   e.preventDefault();
   var car_id = $(this).data('id');
   var bookUserID = JSON.parse(sessionStorage.getItem('auth')).user.id;

   $.ajax({
      url: host + '/cars/' + car_id + '/booking',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ user_id: bookUserID}),
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(response) {
         console.log("Bokad bil", response);
         alert(response)
         displayCars();
      },
      error: function() {
         alert("Error booking car.");
      } 
   });
});


// Cancel car
$(".container").on("click", ".cancel-car", function (e) {
   e.preventDefault();
   var car_id = $(this).data('id');

   $.ajax({
      url: host + '/cars/' + car_id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ user_id: 0}),
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(response) {
         console.log("Avbokad bil", response);
         displayCars();
      },
      error: function() {
         alert("Error cancelling car.");
      } 
   });
});


// Updating car
$(".container").on("click", "#update", function (e) {
   e.preventDefault();
   displayCars();
   alert("Sidan uppdaterades")
});


// Opening modal of editing car
$(".container").on("click", ".edit-car", function (e) {
   e.preventDefault();
   var car_id = $(this).data('id');

   $.ajax({
      url: host + '/cars/' + car_id, 
      type: 'GET',
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(car) {
         $("#editMake").val(car.make);
         $("#editModel").val(car.model);
         if (car.user != null) $("#editUserID").val(car.user.id);
         $("#editCarForm").data("car-id", car_id); 
         $("#editCarModal").modal("show");
      },
      error: function(error) {
         console.error("Error fetching car data for editing:", error);
      }
   });
});


// Submit edit of car
$("#editCarForm").submit(function (e) {
   e.preventDefault();
   var car_id = $(this).data("car-id");
   var updatedMake = $("#editMake").val();
   var updatedModel = $("#editModel").val();
   var updatedUserID = $("#editUserID").val();

   $.ajax({
      url: host + '/cars/' + car_id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ make: updatedMake, model: updatedModel, user_id: updatedUserID}),
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(car) {
         console.log(car);
         displayCars();
         $("#editMake, #editModel, #editUserID").val('');
         $("#editCarModal").modal("hide");
      },
      error: function() {
         alert("Error editing car.");
      } 
   });
});


// Opening modal of adding car
$(".container").on("click", "#addCar", function (e) {
   $("#addMake, #addModel, #addUserID").val('');
});


// Submitting the newly added car
$("#addCarForm").submit(function (e) {
   e.preventDefault();
   var newMake = $("#addMake").val();
   var newModel = $("#addModel").val();
   var newUserID = $("#addUserID").val();

   $.ajax({
      url: host + '/cars',
      type: 'POST',
      contentType: 'application/json', 
      data: JSON.stringify({ make: newMake, model: newModel, user_id: newUserID }), 
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      success: function(newCar) {
         console.log(newCar); 
         displayCars();
         $("#addMake, #addModel, #addUserID").val('');
         $("#addCarModal").modal("hide");
      },
      error: function(error) {
         console.error("Error adding car:", error);
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
