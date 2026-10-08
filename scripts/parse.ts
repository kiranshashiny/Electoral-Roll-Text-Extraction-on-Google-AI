#!/usr/bin/env tsx
import path from 'path';
import { runDatasetParser } from '../src/parser/engine';

async function main() {
  const args = process.argv.slice(2);
  let targets = args.length > 0 ? args : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '208', '207'];

  console.log('\n======================================================================');
  console.log('   ELECTORAL ROLL PDF PARSER & CSV EXTRACTOR ENGINE');
  console.log('   Assembly Constituency: 158 - HEBBAL (GEN)');
  console.log('======================================================================\n');

  const outputsDir = path.resolve('outputs');
  console.log(`[OUTPUT FOLDER LOCATION]: ${outputsDir}\n`);

  for (const target of targets) {
    console.log(`----------------------------------------------------------------------`);
    console.log(`>>> STARTING JOB FOR DATASET: "${target}"`);
    console.log(`----------------------------------------------------------------------`);

    const result = await runDatasetParser({
      datasetId: target,
      onProgress: (prog) => {
        const barLength = 25;
        const filled = Math.round((prog.percent / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        process.stdout.write(`\r[${bar}] ${prog.percent.toString().padStart(3)}% | ${prog.phase.toUpperCase()} | ${prog.message}`);
        if (prog.percent === 100) {
          process.stdout.write('\n');
        }
      },
      onLog: (log) => {
        // Log is captured and summary will be presented
      }
    });

    console.log(`\n✔ DATASET PROCESSED SUCCESSFULLY!`);
    console.log(`- Dataset ID: ${result.datasetId}`);
    console.log(`- Output CSV File: ${result.outputCsvName}`);
    console.log(`- Saved At: ${result.outputCsvPath}`);
    console.log(`- Total Records Extracted: ${result.totalRecords}`);
    console.log(`- Time Taken: ${result.durationMs}ms`);
    console.log(`- Location of Output Folder: ${outputsDir}`);

    console.log('\n======================================================================');
    console.log(`   CSV OUTPUT FOR DATASET: ${result.outputCsvName} (First 20 lines)`);
    console.log('======================================================================');
    const previewLines = result.csvContent.split('\n').slice(0, 20);
    console.log(previewLines.join('\n'));
    if (result.totalRecords > 20) {
      console.log(`... [and ${result.totalRecords - 20} more records in ${result.outputCsvPath}]`);
    }
    console.log('======================================================================\n');
  }

  console.log(`All operations completed.`);
  console.log(`Output folder is located at: ${outputsDir}\n`);
}

main().catch(err => {
  console.error('Fatal parsing error:', err);
  process.exit(1);
});
