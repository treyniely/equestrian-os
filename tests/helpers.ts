import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
export function fixture() { const sql = new DatabaseSync(':memory:'); for (const file of ['drizzle/0000_deep_pet_avengers.sql', 'drizzle/0001_motionless_mother_askani.sql','drizzle/0002_horse_workload.sql','drizzle/0003_use_weekly_availability.sql','drizzle/0004_team_access.sql','drizzle/0005_multiple_academies.sql','drizzle/0006_family_portal.sql','drizzle/0007_customer_audiences.sql','drizzle/0008_barn_team.sql','drizzle/0009_normal_vector.sql','drizzle/0010_fluffy_cloak.sql','drizzle/0011_regular_molecule_man.sql','drizzle/0012_heavy_kree.sql'])
    sql.exec(readFileSync(file, 'utf8')); function prepare(query: string) { let values: any[] = []; return { bind(...v: any[]) { values = v; return this; }, async all() { return { results: sql.prepare(query).all(...values) }; }, async first() { return sql.prepare(query).get(...values) ?? null; }, run() { return sql.prepare(query).run(...values); } }; } const db = { prepare, async batch(statements: any[]) { sql.exec('BEGIN'); try {
        const results = statements.map(s => s.run());
        sql.exec('COMMIT');
        return results;
    }
    catch (e) {
        sql.exec('ROLLBACK');
        throw e;
    } } } as unknown as D1Database; return { db, sql }; }
