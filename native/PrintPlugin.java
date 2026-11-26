package com.hejab.factor;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import androidx.print.PrintHelper;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ImagePrint")
public class PrintPlugin extends Plugin {
    @PluginMethod
    public void printImage(final PluginCall call) {
        String data = call.getString("data");
        if (data == null) { call.reject("no data"); return; }
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            final Bitmap bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
            getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    PrintHelper helper = new PrintHelper(getActivity());
                    helper.setScaleMode(PrintHelper.SCALE_MODE_FIT);
                    helper.printBitmap("Factor", bmp);
                    call.resolve();
                }
            });
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
