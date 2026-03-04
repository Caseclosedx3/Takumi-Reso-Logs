use crate::live::commands_models::PanelAttrState;
use crate::live::opcodes_models::{AttrType, AttrValue, Entity};
use std::collections::HashMap;

#[derive(Debug, Default)]
pub struct EntityAttrStore {
    attrs: HashMap<i64, HashMap<AttrType, AttrValue>>,
    temp_attrs: HashMap<i32, i32>,
    local_player_uid: i64,
    panel_attr_values: HashMap<i32, i32>,
    dirty_attrs: Vec<(i64, AttrType)>,
    dirty_temp_attrs: Vec<i32>,
    cd_dirty: bool,
    panel_dirty_attrs: Vec<PanelAttrState>,
}

#[derive(Debug, Default)]
pub struct AttrChanges {
    pub dirty_attrs: Vec<(i64, AttrType)>,
    pub dirty_temp_attrs: Vec<i32>,
    pub cd_dirty: bool,
    pub panel_dirty_attrs: Vec<PanelAttrState>,
}

impl EntityAttrStore {
    pub fn with_capacity(attr_entries: usize) -> Self {
        Self {
            attrs: HashMap::with_capacity(attr_entries),
            temp_attrs: HashMap::new(),
            local_player_uid: 0,
            panel_attr_values: HashMap::new(),
            dirty_attrs: Vec::with_capacity(16),
            dirty_temp_attrs: Vec::with_capacity(16),
            cd_dirty: false,
            panel_dirty_attrs: Vec::with_capacity(8),
        }
    }

    pub fn set_local_uid(&mut self, uid: i64) {
        self.local_player_uid = uid;
    }

    pub fn local_uid(&self) -> i64 {
        self.local_player_uid
    }

    pub fn set_attr(&mut self, uid: i64, attr_type: AttrType, value: AttrValue) -> bool {
        let changed = self
            .attrs
            .entry(uid)
            .or_default()
            .get(&attr_type)
            .is_none_or(|prev| *prev != value);
        if !changed {
            return false;
        }
        self.attrs.entry(uid).or_default().insert(attr_type, value);
        self.dirty_attrs.push((uid, attr_type));
        if uid == self.local_player_uid
            && matches!(
                attr_type,
                AttrType::SkillCd | AttrType::SkillCdPct | AttrType::CdAcceleratePct
            )
        {
            self.cd_dirty = true;
        }
        true
    }

    pub fn set_panel_attr(&mut self, attr_id: i32, value: i32) -> bool {
        let prev = self.panel_attr_values.insert(attr_id, value);
        if prev == Some(value) {
            return false;
        }
        self.panel_dirty_attrs
            .push(PanelAttrState { attr_id, value });
        true
    }

    pub fn panel_attr_value(&self, attr_id: i32) -> Option<i32> {
        self.panel_attr_values.get(&attr_id).copied()
    }

    pub fn set_temp_attr(&mut self, attr_id: i32, value: i32) -> bool {
        let prev = self.temp_attrs.insert(attr_id, value);
        if prev == Some(value) {
            return false;
        }
        self.dirty_temp_attrs.push(attr_id);
        self.cd_dirty = true;
        true
    }

    pub fn attr(&self, uid: i64, attr_type: AttrType) -> Option<&AttrValue> {
        self.attrs
            .get(&uid)
            .and_then(|entity_attrs| entity_attrs.get(&attr_type))
    }

    pub fn hydrate_entity(&self, uid: i64, entity: &mut Entity) {
        if let Some(name) = self
            .attr(uid, AttrType::Name)
            .and_then(AttrValue::as_string)
        {
            if !name.is_empty() {
                entity.name = name.to_string();
            }
        }
        if let Some(value) = self
            .attr(uid, AttrType::ProfessionId)
            .and_then(AttrValue::as_int)
        {
            entity.class_id = value as i32;
        }
        if let Some(value) = self
            .attr(uid, AttrType::FightPoint)
            .and_then(AttrValue::as_int)
        {
            entity.ability_score = value as i32;
        }
        if let Some(value) = self.attr(uid, AttrType::Level).and_then(AttrValue::as_int) {
            entity.level = value as i32;
        }
        if let Some(value) = self
            .attr(uid, AttrType::SeasonStrength)
            .and_then(AttrValue::as_int)
        {
            entity.season_strength = value as i32;
        }
    }

    pub fn temp_attrs(&self) -> &HashMap<i32, i32> {
        &self.temp_attrs
    }

    pub fn cd_inputs(&self) -> (f32, f32, f32) {
        let uid = self.local_player_uid;
        let attr_skill_cd = self
            .attr(uid, AttrType::SkillCd)
            .and_then(AttrValue::as_int)
            .unwrap_or(0) as f32;
        let attr_skill_cd_pct = self
            .attr(uid, AttrType::SkillCdPct)
            .and_then(AttrValue::as_int)
            .unwrap_or(0) as f32;
        let attr_cd_accelerate_pct = self
            .attr(uid, AttrType::CdAcceleratePct)
            .and_then(AttrValue::as_int)
            .unwrap_or(0) as f32;
        (attr_skill_cd, attr_skill_cd_pct, attr_cd_accelerate_pct)
    }

    pub fn mark_cd_dirty(&mut self) {
        self.cd_dirty = true;
    }

    pub fn clear_entity(&mut self, uid: i64) {
        if let Some(prev) = self.attrs.remove(&uid) {
            for attr_type in prev.keys().copied() {
                self.dirty_attrs.push((uid, attr_type));
            }
        }
    }

    pub fn drain_changes(&mut self) -> AttrChanges {
        AttrChanges {
            dirty_attrs: std::mem::take(&mut self.dirty_attrs),
            dirty_temp_attrs: std::mem::take(&mut self.dirty_temp_attrs),
            cd_dirty: std::mem::take(&mut self.cd_dirty),
            panel_dirty_attrs: std::mem::take(&mut self.panel_dirty_attrs),
        }
    }
}
