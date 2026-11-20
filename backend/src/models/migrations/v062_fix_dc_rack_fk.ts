/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Migration } from './migrationFramework';
import { logger } from '../../utils/logger';

/**
 * Migration v062 — Fix broken FK references to non-existent _dc_racks_backup
 *
 * 背景：dc_rack_slots / dc_power_feeds 的外键引用了不存在的 `_dc_racks_backup` 表
 * （应引用 dc_racks），导致 DELETE network_devices / dc_rack_slots 等操作抛出
 * "no such table: main._dc_racks_backup"，网络设备无法删除。
 *
 * 两表数据为空，直接重建为正确外键引用 dc_racks。
 */
const v062FixDcRackFk: Migration = {
  id: '20250101000062',
  version: 62,
  name: 'fix_dc_rack_fk',
  description: 'Recreate dc_rack_slots and dc_power_feeds with FK to dc_racks (fix dangling _dc_racks_backup reference)',

  up: async (db: any) => {
    logger.info('🔄 Fixing dangling FK references to _dc_racks_backup...');

    // 关闭外键约束，允许重建
    db.pragma('foreign_keys = OFF');

    // 重建 dc_rack_slots
    db.exec(`DROP TABLE IF EXISTS dc_rack_slots;`);
    db.exec(`
      CREATE TABLE dc_rack_slots (
        id TEXT PRIMARY KEY,
        rack_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        device_type TEXT NOT NULL CHECK(device_type IN ('server','network_device','vm_host','pdu','ups','other')),
        device_type_id TEXT,
        start_u INTEGER NOT NULL,
        end_u INTEGER NOT NULL,
        position_face TEXT DEFAULT 'front',
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime')),
        updated_at TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (rack_id) REFERENCES dc_racks(id) ON DELETE CASCADE,
        FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE SET NULL
      );
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dc_rack_slots_device ON dc_rack_slots(device_type, device_id);`);

    // 重建 dc_power_feeds
    db.exec(`DROP TABLE IF EXISTS dc_power_feeds;`);
    db.exec(`
      CREATE TABLE dc_power_feeds (
        id TEXT PRIMARY KEY,
        power_panel_id TEXT NOT NULL,
        rack_id TEXT DEFAULT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active','planned','failed','decommissioned')),
        feed_type TEXT DEFAULT 'primary' CHECK(feed_type IN ('primary','redundant')),
        supply TEXT DEFAULT 'ac' CHECK(supply IN ('ac','dc')),
        voltage REAL DEFAULT 220,
        amperage REAL DEFAULT 16,
        max_utilization_pct REAL DEFAULT 80,
        current_load_w REAL DEFAULT 0,
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime')),
        updated_at TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (power_panel_id) REFERENCES dc_power_panels(id) ON DELETE RESTRICT,
        FOREIGN KEY (rack_id) REFERENCES dc_racks(id) ON DELETE SET NULL
      );
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dc_power_feeds_panel ON dc_power_feeds(power_panel_id);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dc_power_feeds_rack ON dc_power_feeds(rack_id);`);

    // 重建 v059 的插入验证 trigger（表重建后 trigger 丢失）
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_dc_rack_slots_validate_insert
      BEFORE INSERT ON dc_rack_slots
      FOR EACH ROW
      WHEN
        (NEW.device_type = 'server'
          AND NOT EXISTS (SELECT 1 FROM servers WHERE id = NEW.device_id))
        OR (NEW.device_type = 'network_device'
          AND NOT EXISTS (SELECT 1 FROM network_devices WHERE id = NEW.device_id))
        OR (NEW.device_type = 'vm_host'
          AND NOT EXISTS (SELECT 1 FROM virtual_machines WHERE id = NEW.device_id))
        OR (NEW.device_type IN ('pdu', 'ups')
          AND NOT EXISTS (SELECT 1 FROM dc_pdus WHERE id = NEW.device_id))
        OR NEW.device_type NOT IN ('server','network_device','vm_host','pdu','ups','other')
      BEGIN
        SELECT RAISE(ABORT, 'dc_rack_slots: device_id not found in corresponding table or device_type invalid');
      END;
    `);

    db.pragma('foreign_keys = ON');

    logger.info('✅ Fixed dangling FK references to _dc_racks_backup');
  },

  down: async (db: any) => {
    // no-op: 已重建的表无法回滚到错误状态（也不应回滚）
    logger.info('⏭️ v062 down: no-op');
  },
};

export default v062FixDcRackFk;
