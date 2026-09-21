// Shared synthesis function also supports OfflineAudioContext for signal checks.
export function scheduleCue(context,destination,kind='reveal') {
  const now=context.currentTime;
  const notes=kind==='pack'?[440,554.37,659.25]:kind==='product'?[392,587.33]:[523.25];
  notes.forEach((frequency,index)=>{
    const oscillator=context.createOscillator(),gain=context.createGain();
    const at=now+index*.07;
    // Triangle harmonics stay audible through small phone speakers.
    oscillator.type='triangle';oscillator.frequency.setValueAtTime(frequency,at);
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.16,at+.018);
    gain.gain.exponentialRampToValueAtTime(.001,at+.32);
    oscillator.connect(gain);gain.connect(destination);oscillator.start(at);oscillator.stop(at+.36);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  });
}

export function createSound(onState) {
  let context,master,enabled=true;
  const report=()=>onState({enabled,ready:context?.state==='running'});
  return {
    get enabled(){return enabled;},
    get ready(){return context?.state==='running';},
    async unlock(){
      if(!enabled){report();return false;}
      try {
        const AudioContext=window.AudioContext||window.webkitAudioContext;
        if(!AudioContext){report();return false;}
        if(!context){
          context=new AudioContext({latencyHint:'interactive'});
          master=context.createGain();master.gain.value=.75;master.connect(context.destination);
          context.onstatechange=report;
        }
        // Called directly from a user gesture, before imports or camera requests.
        await context.resume();report();return context.state==='running';
      }catch{report();return false;}
    },
    setEnabled(value){
      enabled=value;
      if(master)master.gain.setValueAtTime(value?.75:0,context.currentTime);
      report();
    },
    play(kind){
      if(!enabled||!context||context.state!=='running'){report();return false;}
      scheduleCue(context,master,kind);return true;
    },
  };
}
