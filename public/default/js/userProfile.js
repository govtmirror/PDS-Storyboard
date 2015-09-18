var initEditUserModal = function() {
  $(document).on('change', 'input:radio[name="affiliation"]', function (event) {
    var target = $(event.target);
    if(event.target.value == "university"){
      $(".affiliation_university").removeClass("hide");
      $(".affiliation_organization").addClass("hide");
      $(".affiliation_url").removeClass("hide");
      $(".affiliation_department").removeClass("hide");
      $(".affiliation_position").removeClass("hide");
    } else if(event.target.value == "organization") {
      $(".affiliation_university").addClass("hide");
      $(".affiliation_organization").removeClass("hide");
      $(".affiliation_url").removeClass("hide");
      $(".affiliation_department").removeClass("hide");
      $(".affiliation_position").removeClass("hide");
    } else { // "researcher"
      $(".affiliation_university").addClass("hide");
      $(".affiliation_organization").addClass("hide");
      $(".affiliation_url").addClass("hide");
      $(".affiliation_department").addClass("hide");
      $(".affiliation_position").addClass("hide");
    }
  });

  ["university", "organization", "department", "position", "interest"].forEach(function(lookup){
    $.ajax({
      type: 'GET',
      url: '/user/edit/lookup/' + lookup,
      dataType: 'json',
      success : function(response){
        var lookups = response.map(function(obj){
          return obj.name;
        });
        if(lookup != "interest") {
          initTypeAheadInput('#edituser_affiliation_' + lookup, lookups);
        } else {
          initTypeAheadInput('#edituser_interests_new', lookups);
        }
      },
      error: function(xhr){
        console.log(xhr);
      }
    });
  });

  // ajax form to validate files
  $('#user_form').ajaxForm({
    beforeSend: function(){
      $('.loader').show();
    },
    success:function(data) {
      if(data.error==1){
        $(".brderrmsg").html(data.msg);
      } else {
        $('#myModal9').modal('hide');
        location.href = '/user/'+data.user_id
      }
    },
    error: function(e){
      $(".brderrmsg").html(e);
    },
    complete: function(jqxhr, status, error) {
      $('.loader').hide();
    }
  });
  $("#update_user").click(function(){
    $("#user_form").validate();
  });

  $(".add_new").click(addNewInterestTag);
  $(".del_btn").click(removeInterestTag);

  $('input[name="affiliation"][checked]').trigger("change")
};

var addNewInterestTag = function() {
  var values = $("#edituser_interests_new_input").val().trim();
  var interestValues = $("#edituser_interests").val().split(",");
  $(".brderrmsg").empty();
  interestValuesLC = jQuery.map(interestValues, function(value) {
    return value.toLowerCase();
  });
  values.split(",").forEach(function(value){
    value = value.trim();
    if(value.length > 0 && interestValuesLC.indexOf(value.toLowerCase()) == -1) {
      if(value.length > 50){
        $(".brderrmsg").html('Research Interest should not exceed 50 characters');
      }else{
        interestValues.push(value);
        $(".edit_user_tag_boxs").append('<span class="edit_user_tags">' +
          '  <a href="javascript:;" class="del_btn"></a>' +
          '  <a href="javascript:;" class="text_btn">' + value + '</a>' +
          '</span>');
        $(".edit_user_tag_boxs").find(".del_btn").click(removeInterestTag);
      }
    }
  });
  $("#edituser_interests_new_input").val("");
  $("#edituser_interests").val(interestValues.join(","));
};

var removeInterestTag = function() {
  var interestValues = $("#edituser_interests").val().split(",");
  var value = $(this).siblings(".text_btn").text().trim();
  interestValues.splice(interestValues.indexOf(value), 1);
  $("#edituser_interests").val(interestValues.join(","));
  $(this).parent().remove();
};

var initTypeAheadInput = function(inputId, values){
  if($(inputId).find('.twitter-typeahead').length > 0) {
    return;
  }
  var engine = new Bloodhound({
    local: values,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    datumTokenizer: Bloodhound.tokenizers.whitespace
  });
  $(inputId).find('.typeahead').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  },{
    source: engine
  });
  $(inputId).find('.twitter-typeahead')[0].style.display = "block";

  $(inputId).find('.typeahead').on('input', function(){
    $('.tt-suggestion').hover(function(){
      $(this).addClass('tt-is-under-cursor');
    }, function(){
      $(this).removeClass('tt-is-under-cursor');
    });
    if($("#edituser_interests_new_input").val().trim().length > 0) {
      $(".add_new_tags").removeClass("hide");
    } else {
      $(".add_new_tags").addClass("hide");
    }
  });
};
