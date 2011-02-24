function () {
  var patient = this;
  var measure = patient.measures["0012"];
  if (measure==null)
    measure={};

  <%= init_js_frameworks %>

  var day = 24*60*60;
  var year = 365 * day;
  var effective_date =  <%= effective_date %>;
  var earliest_encounter = effective_date - year;

  var population = function() {
    live_birth_diagnosis = inRange(measure.delivery_live_births_diagnosis_diagnosis_active, earliest_encounter, effective_date);
    live_birth_procedure = inRange(measure.delivery_live_births_procedure_procedure_performed, earliest_encounter, effective_date);
    return live_birth_diagnosis && live_birth_procedure;
  }
  
  var denominator = function() {
    if (!measure.estimated_date_of_conception_patient_characteristic)
      return false;
    estimated_conception = _.max(measure.estimated_date_of_conception_patient_characteristic);
    return inRange(measure.prenatal_visit_encounter, estimated_conception, effective_date);
  }

  var numerator = function() {
    estimated_conception = _.max(measure.estimated_date_of_conception_patient_characteristic);
    estimated_conception_within_ten_months = actionFollowingSomething(estimated_conception, measure.delivery_live_births_procedure_procedure_performed, 304*day);
    encounters_in_range = selectWithinRange(measure.prenatal_visit_encounter, estimated_conception, effective_date);
    first_encounter = _.min(encounters_in_range);
    encounters_in_range = selectWithinRange(measure.prenatal_visit_encounter, first_encounter+day, effective_date);
    second_encounter = _.min(encounters_in_range);
    hiv_screen_after_first = actionFollowingSomething(first_encounter, measure.hiv_screening_laboratory_test_performed, 30*day);
    hiv_screen_after_second = actionFollowingSomething(second_encounter, measure.hiv_screening_laboratory_test_performed, 30*day);
    
    return estimated_conception_within_ten_months && (hiv_screen_after_first || hiv_screen_after_second);
  }

  var exclusion = function() {
    hiv_prior_to_encounter = actionFollowingSomething(measure.hiv_diagnosis_active, measure.prenatal_visit_encounter, year);
    medical_reason = inRange(measure.medical_reason_laboratory_test_not_done, earliest_encounter, effective_date);
    patient_reason = inRange(measure.patient_reason_laboratory_test_not_done, earliest_encounter, effective_date);
    return hiv_prior_to_encounter || medical_reason || patient_reason;
  }

  map(patient, population, denominator, numerator, exclusion);
};