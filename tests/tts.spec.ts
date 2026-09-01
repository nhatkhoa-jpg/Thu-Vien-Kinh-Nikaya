import {test,expect} from '@playwright/test';

test('library Vietnamese voice generates playable neural audio',async({page,browserName})=>{
  await page.goto('/__test/tts');
  await page.getByRole('button',{name:'Nghe'}).click();

  const diag=page.getByTestId('tts-diagnostics');
  await expect.poll(async()=>Number(await diag.getAttribute('data-audio-bytes')),{timeout:120_000}).toBeGreaterThan(20_000);
  const duration=Number(await diag.getAttribute('data-audio-duration'));
  expect(duration,`${browserName}: generated speech duration`).toBeGreaterThan(4);
  expect(duration,`${browserName}: generated speech duration`).toBeLessThan(30);

  await expect.poll(async()=>await diag.getAttribute('data-engine'),{timeout:30_000}).toBe('library');
  const state=await diag.getAttribute('data-state');
  expect(['speaking','paused','idle']).toContain(state);
});
