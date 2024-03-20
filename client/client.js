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
   $('#applications, #messages').toggleClass('d-none', !isAdmin);
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
            if (!bike.is_listed) {
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


function sortBikes(sortByValue, bikes)  {
   if (sortByValue == 1) {
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

function displaySortedBikes(value){
   console.log(value);

}

// Function to fetch and display bikes in View bikes script
function displayAllBikes() {
   $(".container").html($("#view-home").html());
   $("#home-list").empty(); 
   var sortByValue = document.getElementById('selectSort').value;
   console.log(sortByValue);

   $.ajax({
      url: host + '/bikes',
      type: 'GET',
      success: function(bikes) {
         bikes = sortBikes(sortByValue, bikes);
         bikes.forEach(function (bike) {
            if (bike.is_listed) {
            var bikeView = `      
               <div class="card mb-3">
               ${bike.picture}
                  <div class="card-body">
                     <h5 class="card-title">${bike.model} </h5> 
                     <p class="card-text">Price: ${bike.price} </p>
                     <button class="btn btn-success purchase-bike" onclick="showBike(${bike.id})" data-id="${bike.id}">Read more</button>
                  </div>
               </div>`
            $("#home-list").append(bikeView);
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
            <img class="card-img-top" src=${bike.picture} alt= "Card image cap" style="max-height: 18rem;">
            <div class="card-body">
                        <h5 class="card-title">${bike.model} </h5> 
                        <p class="card-text">Price: ${bike.price} </p>
                        <p class="card-text">Gears: ${bike.gears} </p>
                        <p class="card-text">Condition: ${bike.condition} </p>
                        <p class="card-text">Age: ${bike.age} </p>
                        <button class="btn btn-success purchase-bike" onclick="purchaseBikebutton(${bike.id})" data-id="${bike.id}">Purchase</button>
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
               <img class="card-img-top" src="${bike.picture}" style="max-height: 18rem;">
               <div class="card-body">
                  <h5 class="card-title">${bike.model} </h5> 
                  <p class="card-text">Price: ${bike.price} </p>
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
   // var fileInput = document.getElementById('exampleFormControlFile1');
   $.ajax({
      url: host + '/users/' + user_id + '/bikes',
      type: 'POST',
      contentType: 'application/json', 
      headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem('auth')).token},
      data: JSON.stringify({
         model: newModel, 
         price: newPrice, 
         gears: newGears, 
         age: newAge,
         condition: newCondition,
         // picture: fileInput
      }), 
      success: function() {
         console.log("ajax success");
         $("#addModel, #addPrice, #addGears, #addAge, #addCondition, #exampleFormControlFile1").val('');
         $("#addBikeModal").modal("hide");
      },
      error: function(error) {
         console.error("Error adding bike:", error);
      }
   });
   alert("You have successfully submitted your application. After a careful review from reCycle it will be posted on the web application. You can see the status of your application on the 'My bikes' page.");
   viewHome()
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
                  </div>`
               if (bike.description_picture == null) {
                  bikeView += `
                  <div class="d-flex justify-content-center">
                     <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                     </div>
                  </div>`
               } else {                     
                  bikeView += `<img class="card-img-top" src=${bike.description_picture} alt= "Card image cap" style="max-height: 18rem;">`
               }
               bikeView += `                 
                     <div class="card-body">
                        <h5 class="card-title">${bike.model} </h5> 
                        <p class="card-text">Price: ${bike.price} </p>
                     </div>
                  </div>`
            $("#home-list").append(bikeView);
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
         console.error("Error signing in user:", error);
      }
   });
   viewHome();
}  

// $("#ex18b").slider({
// 	min: 0,
// 	max: 10,
// 	value: [3, 6],
// 	labelledby: ['ex18-label-2a', 'ex18-label-2b']
// });
