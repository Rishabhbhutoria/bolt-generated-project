(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))n(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const c of t.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function r(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function n(e){if(e.ep)return;e.ep=!0;const t=r(e);fetch(e.href,t)}})();document.getElementById("uploadForm").addEventListener("submit",async s=>{s.preventDefault();const o=new FormData(s.target),r=await fetch("/.netlify/functions/process-pdf",{method:"POST",body:o});if(r.ok){const n=await r.blob(),e=window.URL.createObjectURL(n),t=document.createElement("a");t.href=e,t.download="updated_labels.pdf",document.body.appendChild(t),t.click(),t.remove()}else document.getElementById("result").textContent="Error processing files"});
