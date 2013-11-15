UpdateSpace.UpdateCastView = Backbone.View.extend({
  
  className: 'castView',
  
  events: {
    'click #castSubmit': 'postCastUpdate',
    'click #castUpdate': 'updateCastMember',
    'click #castDelete': 'deleteCastMember',
    'click #castReset': 'resetForm',
    'keyup #cast-form': 'checkFormFilled'
  },

  initialize: function() {
    this.template = this.model.get('templates')['updateCast'];
    this.collection.on('add remove', this.render.bind(this));
    this.currentModel = null;
  },

  render: function() {
    var self = this;
    this.$el.html( this.template(this.model.attributes) );
    this.$el.find('.currentCastList').append(
      this.collection.map(function(item) {
        return new UpdateSpace.CastMemberView({ model: item, parentView: self }).render();
      })
    );
    return this;
  },

  postCastUpdate: function(event) {
    event.preventDefault();
    var data = {};
    _(event.target.form).each(function(field) {
      if (field.name) {
        if(field.name === 'portrait') {
          var val = field.value.split('\\');
          val = val[val.length-1];
          data[field.name] = 'images/cast/' + val;
        } else {
          data[field.name] = field.value;
        }
      }
    });
    var newCastMember = new UpdateSpace.CastMember(data);
    newCastMember.save();
    this.collection.add(newCastMember);
  },

  addMemberToForm: function(model) {
    this.currentModel = model;
    var form = $('#cast-form').get(0);
    form[0].value = model.get('name');
    form[2].value = model.get('role');
    form[3].value = model.get('bio');
    $('#castUpdate, #castDelete').prop('disabled', false);
  },

  updateCastMember: function(event) {
    event.preventDefault();
    var data = {};
    _(event.target.form).each(function(field) {
      if (field.name) {
        if(field.name === 'portrait') {
          if (field.value === 'undefined') {
            data[field.name] = this.currentModel.get('portrait');
          } else {
            var val = field.value.split('\\');
            val = val[val.length-1];
            data[field.name] = 'images/cast/' + val;
          }
        } else {
          data[field.name] = field.value;
        }
      }
    });
    this.currentModel.save(data);
    this.collection.fetch();
  },

  deleteCastMember: function(event) {
    event.preventDefault();
    this.collection.remove(this.currentModel);
    this.currentModel.destroy();
    this.currentModel = null;
  },

  resetForm: function(event) {
    event.preventDefault();
    $('#cast-form')[0].reset();
    $('#castUpdate, #castDelete, #castSubmit').prop('disabled', true);
    this.currentModel = null;
  },

  checkFormFilled: function() {
    var empty = false;
    $('#cast-form > .cast-field').each(function() {
      if ($(this).val() === '') {
        empty = true;
      }
    });

    if (empty) {
      $('#castSubmit').prop('disabled', true);
    } else {
      $('#castSubmit').prop('disabled', false);
    }
  }

});
