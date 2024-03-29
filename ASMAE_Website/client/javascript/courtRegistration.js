/*
    This file defines how the form to register a new court works and looks.
*/
Template.courtForm.helpers({
    'checked': function(available){
        if(available === null){
            return 'checked';
        }
        else
        {
            if(available){
                return 'checked';
            }
            else{
                return '';
            }
        }
    },

    'selectedSurface': function(value, surfaceName){
        return value === surfaceName ? 'selected' : '';
    },

    'isPrivate': function(value){
        if(value === "privé"){
            return 'checked';
        }
        else{
            return '';
        }
    },
    'isClub': function(value){
        if(value === "club"){
            return 'checked';
        }
        else{
            return '';
        }
    }
});

Template.courtRegistration.events({
    'submit form': function(event){

        event.preventDefault();
        var address = {
            street : $('[name=street]').val(),
            number : $('[name=addressNumber]').val(),
            box : $('[name=box]').val(),
            city : $('[name=city]').val(),
            zipCode : $('[name=zipCode]').val(),
            country : $('[name=country]').val(),
            isCourtAddress : true
        };

		var courtData = {
            surface : $('[name=surface]').val(),
        	courtType : $('[name=courtType]:checked').val(),
            numberOfCourts : $('[name=numberOfCourts]').val(),
        	instructions : $('[name=instructions]').val(),
        	ownerComment : $('[name=ownerComment]').val(),
            dispoSamedi : $('[name=dispoSamedi]').is(":checked"),
            dispoDimanche : $('[name=dispoDimanche]').is(":checked"),
            staffOK : false, // Default to false
            ownerOK : true, // Default to true
            isOutdoor: $('[name=isOutdoor]').is(":checked")
        };
        if(this.court){ //Used for the update of an existing court
            courtData._id = this.court._id;
            courtData.ownerID = this.court.ownerID;
            courtData.courtNumber = this.court.courtNumber;
        }
        else{
            courtData.ownerID = Meteor.userId();
        }

        Meteor.call("updateAddress",address, function(err, res){
            if(err){
                console.error("courtRegistration error");
                console.error(err);
                return;
            }

            // Set addressID :
            courtData.addressID = res;

            Meteor.call('updateCourt', courtData, function(error, result){
                if(error){
                    console.error('CourtRegistration error');
                    console.error(error);
                }
                else if(result == null){
                    console.error("No result");
                }
                if(!Meteor.user().profile.isStaff){
                    var data = {
                        intro:"Bonjour "+Meteor.user().username+",",
                        important:"Merci pour le prêt de votre terrain !",
                        texte:"Si vous recevez ce mail, c'est que vous venez d'inscrire votre terrain ou que vous venez de modifier certaines informations par rapport à celui-ci.",
                        encadre:"Si jamais les informations par rapport à votre terrain sont erronées, n'hésitez pas à nous envoyer un email ou de modifier vous-même les informations !\n Pour toutes questions notre staff sera ravi de vour répondre via l'onglet \"contact\"/.",

                    };
                    Meteor.call('emailFeedback',Meteor.user().emails[0].address,"Concernant le prêt de votre terrain",data, function(err, res){
                        if(err){
                            console.error(err);
                        }
                    });
                }

                // Add to Modifications logs
        		if((Meteor.user().profile.isAdmin || Meteor.user().profile.isStaff) && courtData._id){
                    addToLog("Modification terrain", courtData.ownerID, courtData._id);
        		}

                Router.go('confirmationRegistrationCourt', {_id: result});
            });
        })



    }
});
