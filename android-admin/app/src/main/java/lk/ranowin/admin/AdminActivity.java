package lk.ranowin.admin;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.CookieManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;

/** Hosts one Apps Script admin web app in a WebView. */
public class AdminActivity extends Activity {

    private static final int FILE_REQ = 1001;
    private WebView web;
    private ProgressBar progress;
    private ValueCallback<Uri[]> filePathCallback;
    private Dialog popupDialog;
    private WebView popupWeb;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        String url = getIntent().getStringExtra("url");
        setTitle(getIntent().getStringExtra("title"));

        FrameLayout root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        root.addView(progress, new FrameLayout.LayoutParams(-1, 8));
        setContentView(root);

        setup(web);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, android.webkit.WebResourceRequest r) {
                return openExternalIfNeeded(r.getUrl());
            }
            @Override public void onPageFinished(WebView v, String u) { progress.setVisibility(View.GONE); }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView v, int p) {
                progress.setProgress(p);
                progress.setVisibility(p >= 100 ? View.GONE : View.VISIBLE);
            }
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = cb;
                try {
                    startActivityForResult(p.createIntent(), FILE_REQ);
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
            @Override public boolean onJsAlert(WebView v, String u, String m, final JsResult r) {
                new AlertDialog.Builder(AdminActivity.this).setMessage(m)
                    .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface d, int w) { r.confirm(); }})
                    .setOnCancelListener(new DialogInterface.OnCancelListener() {
                        public void onCancel(DialogInterface d) { r.cancel(); }}).show();
                return true;
            }
            @Override public boolean onJsConfirm(WebView v, String u, String m, final JsResult r) {
                new AlertDialog.Builder(AdminActivity.this).setMessage(m)
                    .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface d, int w) { r.confirm(); }})
                    .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface d, int w) { r.cancel(); }})
                    .setOnCancelListener(new DialogInterface.OnCancelListener() {
                        public void onCancel(DialogInterface d) { r.cancel(); }}).show();
                return true;
            }
            // Admin pages open bills / labels with window.open('', '_blank') then document.write + print.
            @Override public boolean onCreateWindow(WebView v, boolean dialog, boolean userGesture, Message msg) {
                showPopup(msg);
                return true;
            }
            @Override public void onCloseWindow(WebView w) { closePopup(); }
        });

        web.loadUrl(url);
    }

    private void setup(WebView w) {
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setSupportMultipleWindows(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setBuiltInZoomControls(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(w, true);
    }

    private boolean openExternalIfNeeded(Uri u) {
        String host = u.getHost() == null ? "" : u.getHost();
        boolean google = host.endsWith("google.com") || host.endsWith("googleusercontent.com");
        if (google && "https".equals(u.getScheme())) return false;   // stay in app
        try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
        return true;
    }

    private void showPopup(Message msg) {
        closePopup();
        popupWeb = new WebView(this);
        setup(popupWeb);
        popupWeb.setWebViewClient(new WebViewClient());
        popupWeb.setWebChromeClient(new WebChromeClient() {
            @Override public void onCloseWindow(WebView w) { closePopup(); }
        });
        WebView.WebViewTransport t = (WebView.WebViewTransport) msg.obj;
        t.setWebView(popupWeb);
        msg.sendToTarget();

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        LinearLayout bar = new LinearLayout(this);
        bar.setBackgroundColor(Color.parseColor("#43246F"));
        Button print = new Button(this); print.setText("Print / Save PDF");
        Button close = new Button(this); close.setText("Close");
        bar.addView(print, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        bar.addView(close, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        box.addView(bar);
        box.addView(popupWeb, new LinearLayout.LayoutParams(-1, 0, 1));

        print.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                if (popupWeb == null) return;
                PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                pm.print("Ranowin document", popupWeb.createPrintDocumentAdapter("Ranowin document"),
                        new PrintAttributes.Builder().build());
            }
        });
        close.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { closePopup(); }
        });

        popupDialog = new Dialog(this, android.R.style.Theme_Material_Light_NoActionBar);
        popupDialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        popupDialog.setContentView(box);
        popupDialog.setOnDismissListener(new DialogInterface.OnDismissListener() {
            @Override public void onDismiss(DialogInterface d) {
                if (popupWeb != null) { popupWeb.destroy(); popupWeb = null; }
                popupDialog = null;
            }
        });
        popupDialog.show();
    }

    private void closePopup() {
        if (popupDialog != null) popupDialog.dismiss();
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == FILE_REQ && filePathCallback != null) {
            Uri[] r = (res == RESULT_OK && data != null)
                    ? WebChromeClient.FileChooserParams.parseResult(res, data) : null;
            filePathCallback.onReceiveValue(r);
            filePathCallback = null;
        } else super.onActivityResult(req, res, data);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        closePopup();
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
