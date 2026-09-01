import {test,expect} from '@playwright/test';

test('library Vietnamese voice generates decodable neural audio',async({page,browserName})=>{
  const consoleErrors:string[]=[];
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
  page.on('pageerror',error=>consoleErrors.push(error.message));

  await page.goto('/tts-e2e');
  await expect(page.getByRole('heading',{name:'V4.11 TTS E2E'})).toBeVisible();
  await page.getByRole('button',{name:'Nghe'}).click();

  const diag=page.getByTestId('tts-diagnostics');
  await expect.poll(async()=>Number(await diag.getAttribute('data-audio-bytes')),{timeout:180_000}).toBeGreaterThan(20_000);
  const duration=Number(await diag.getAttribute('data-audio-duration'));
  expect(duration,`${browserName}: generated speech duration`).toBeGreaterThan(4);
  expect(duration,`${browserName}: generated speech duration`).toBeLessThan(30);
  await expect.poll(async()=>await diag.getAttribute('data-engine'),{timeout:30_000}).toBe('library');
  expect(consoleErrors,`${browserName}: browser errors`).toEqual([]);
});
