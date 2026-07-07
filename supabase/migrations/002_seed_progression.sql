INSERT INTO progression_methods (name, slug, method_type, config, is_custom) VALUES
('Double Progression','double-progression','double_progression','{"rep_range_min":8,"rep_range_max":12,"sets":3,"weight_increment_kg":2.5,"rest_seconds":120}',FALSE),
('Double Progression + RIR','double-progression-rir','double_progression_rir','{"rep_range_min":8,"rep_range_max":12,"sets":3,"weight_increment_kg":2.5,"rir_target":2,"rir_threshold":1,"rest_seconds":120}',FALSE),
('Top Set + Back Off','top-set-backoff','top_set_backoff','{"top_set_rpe":9,"backoff_percent":0.85,"backoff_sets":3,"rep_range_min":5,"rep_range_max":5,"rest_seconds":180}',FALSE),
('RP Hypertrophy','rp-hypertrophy','rp_hypertrophy','{"mev_sets":10,"mav_sets":20,"mrv_sets":25,"rir_range_min":0,"rir_range_max":3,"mesocycle_weeks":6}',FALSE);
