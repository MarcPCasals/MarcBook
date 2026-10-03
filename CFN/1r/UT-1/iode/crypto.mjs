// Decrypt only after the entered code authenticates the encrypted payload.
export async function decryptPayload(payload, code) {
  const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(payload.salt),iterations:payload.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
  const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(payload.iv)},key,bytes(payload.data));
  return JSON.parse(new TextDecoder().decode(plain));
}
export const normalizeAnswer = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.,;:!?«»"']/g,'').replace(/\s+/g,' ').trim();
export function assessAnswers(answers, key, wordCount) {
  return key.map(item => {
    let correct;
    if(item.words) correct = Array.from({length:wordCount},(_,i)=>answers[`word${i}`] === (i < item.split ? 'blue' : 'red')).every(Boolean);
    else if(item.checkbox) correct = Boolean(answers[item.field]) === item.expected;
    else correct = item.accepted.map(normalizeAnswer).includes(normalizeAnswer(answers[item.field]));
    return {...item,correct};
  });
}
